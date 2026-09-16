import {
  PDFDocument,
  degrees,
  StandardFonts,
} from 'pdf-lib';
import {
  EditorDocumentState,
  TextReplacement,
  AddedTextElement,
  ImageElement,
  SignatureElement,
  DrawingElement,
  ShapeElement,
  WhiteoutElement,
  StampElement,
  AnnotationElement,
} from '../../types/editor';
import { hexToRgb } from './annotations';
import { matchStandardFont, sanitizeTextForPdf } from './fontManager';

export interface ExportPDFParams {
  originalPdfBytes: Uint8Array;
  documentState: EditorDocumentState;
}

/**
 * Converts data URL (base64) to Uint8Array
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const buf = (globalThis as any).Buffer;
  if (buf && typeof buf.from === 'function') {
    return new Uint8Array(buf.from(base64, 'base64'));
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Main PDF Export Engine
 * Applies all edits, covers, text replacements, vectors, images, and page operations
 * to create a genuine, production-grade PDF document.
 */
export async function exportPDF({
  originalPdfBytes,
  documentState,
}: ExportPDFParams): Promise<Uint8Array> {
  // Load original PDF document
  const srcDoc = await PDFDocument.load(originalPdfBytes);
  const outDoc = await PDFDocument.create();

  // Pre-embed standard fonts for reuse
  const helveticaFont = await outDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaItalicFont = await outDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesFont = await outDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await outDoc.embedFont(StandardFonts.TimesRomanBold);
  const courierFont = await outDoc.embedFont(StandardFonts.Courier);
  const courierBoldFont = await outDoc.embedFont(StandardFonts.CourierBold);

  const getFont = (family: string, bold?: boolean, italic?: boolean) => {
    const std = matchStandardFont(family, !!bold, !!italic);
    switch (std) {
      case StandardFonts.HelveticaBold:
      case StandardFonts.HelveticaBoldOblique:
        return helveticaBoldFont;
      case StandardFonts.HelveticaOblique:
        return helveticaItalicFont;
      case StandardFonts.TimesRomanBold:
      case StandardFonts.TimesRomanBoldItalic:
        return timesBoldFont;
      case StandardFonts.TimesRoman:
      case StandardFonts.TimesRomanItalic:
        return timesFont;
      case StandardFonts.CourierBold:
      case StandardFonts.CourierBoldOblique:
        return courierBoldFont;
      case StandardFonts.Courier:
      case StandardFonts.CourierOblique:
        return courierFont;
      default:
        return helveticaFont;
    }
  };

  // Determine active page sequence based on pageOrder & deletedPages
  const activePageOrder = documentState.pageOrder.filter(
    (pageIndex) => !documentState.deletedPages.includes(pageIndex)
  );

  // Map to track the original/target page index to newly created PDF page
  for (let orderIndex = 0; orderIndex < activePageOrder.length; orderIndex++) {
    const originalPageIndex = activePageOrder[orderIndex];

    let outPage;
    if (originalPageIndex < 0) {
      // Negative index denotes an added blank page
      outPage = outDoc.addPage([595.28, 841.89]); // Standard A4
    } else {
      // Copy page from original document
      const [copiedPage] = await outDoc.copyPages(srcDoc, [originalPageIndex]);
      outPage = outDoc.addPage(copiedPage);
    }

    // Apply rotation if modified
    const customRotation = documentState.pageRotations[originalPageIndex];
    if (customRotation !== undefined) {
      outPage.setRotation(degrees(customRotation));
    }

    const { height: pageHeight } = outPage.getSize();

    // 1. Apply Whiteouts (Redactions / covers)
    const pageWhiteouts = documentState.whiteouts.filter(
      (w) => w.pageIndex === originalPageIndex
    );
    for (const whiteout of pageWhiteouts) {
      outPage.drawRectangle({
        x: whiteout.x,
        y: whiteout.y,
        width: whiteout.width,
        height: whiteout.height,
        color: hexToRgb(whiteout.color || '#ffffff'),
        opacity: 1.0,
      });
    }

    // 2. Apply Text Replacements (Visual replacement strategy)
    const pageReplacements = documentState.textReplacements.filter(
      (r) => r.pageIndex === originalPageIndex
    );
    for (const rep of pageReplacements) {
      // Step A: Whitewash original text before edit at its exact original bounds
      // Zero excess padding so table grid borders and lines are NEVER covered or erased
      if (rep.whitewashOriginal !== false) {
        const coverColor =
          rep.backgroundColor && rep.backgroundColor !== 'transparent'
            ? rep.backgroundColor
            : '#ffffff';
        outPage.drawRectangle({
          x: rep.originalBounds.x,
          y: rep.originalBounds.y,
          width: rep.originalBounds.width,
          height: rep.originalBounds.height,
          color: hexToRgb(coverColor),
          opacity: 1.0,
        });
      }

      // Step B: Draw replacement text at target coordinates with transparent box background
      const posX = rep.x !== undefined ? rep.x : rep.originalBounds.x;
      const posY = rep.y !== undefined ? rep.y : rep.originalBounds.y;

      const font = getFont(rep.fontFamily, rep.fontWeight === 'bold', rep.fontStyle === 'italic');
      const sanitized = sanitizeTextForPdf(rep.newText);
      const fontSize = rep.fontSize || rep.originalBounds.height * 0.8;
      const baselineY = posY + (fontSize * 0.15);

      outPage.drawText(sanitized, {
        x: posX,
        y: baselineY,
        size: fontSize,
        font: font,
        color: hexToRgb(rep.color || '#000000'),
      });
    }

    // 3. Apply Highlights, Underlines, Strikethroughs
    const pageAnnotations = documentState.annotations.filter(
      (a) => a.pageIndex === originalPageIndex
    );
    for (const ann of pageAnnotations) {
      if (ann.type === 'highlight') {
        for (const rect of ann.rects) {
          outPage.drawRectangle({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            color: hexToRgb(ann.color || '#fef08a'),
            opacity: ann.opacity || 0.35,
          });
        }
      } else if (ann.type === 'underline') {
        for (const rect of ann.rects) {
          outPage.drawLine({
            start: { x: rect.x, y: rect.y },
            end: { x: rect.x + rect.width, y: rect.y },
            thickness: 1.5,
            color: hexToRgb(ann.color || '#2563eb'),
            opacity: ann.opacity || 0.9,
          });
        }
      } else if (ann.type === 'strikethrough') {
        for (const rect of ann.rects) {
          const midY = rect.y + rect.height * 0.5;
          outPage.drawLine({
            start: { x: rect.x, y: midY },
            end: { x: rect.x + rect.width, y: midY },
            thickness: 1.5,
            color: hexToRgb(ann.color || '#dc2626'),
            opacity: ann.opacity || 0.9,
          });
        }
      } else if (ann.type === 'comment' && ann.x !== undefined && ann.y !== undefined) {
        // Draw comment marker badge
        outPage.drawRectangle({
          x: ann.x,
          y: ann.y,
          width: 22,
          height: 22,
          color: hexToRgb('#f59e0b'),
          opacity: 0.9,
        });
        outPage.drawText('?', {
          x: ann.x + 7,
          y: ann.y + 5,
          size: 14,
          font: helveticaBoldFont,
          color: hexToRgb('#ffffff'),
        });
      }
    }

    // 4. Apply Shapes
    const pageShapes = documentState.shapes.filter(
      (s) => s.pageIndex === originalPageIndex
    );
    for (const shape of pageShapes) {
      const stroke = hexToRgb(shape.strokeColor || '#000000');
      const hasFill = shape.fillColor && shape.fillColor !== 'transparent';
      const fill = hasFill ? hexToRgb(shape.fillColor) : undefined;

      if (shape.shapeType === 'rectangle') {
        outPage.drawRectangle({
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          borderColor: stroke,
          borderWidth: shape.strokeWidth,
          color: fill,
          opacity: shape.opacity || 1.0,
        });
      } else if (shape.shapeType === 'circle') {
        outPage.drawEllipse({
          x: shape.x + shape.width / 2,
          y: shape.y + shape.height / 2,
          xScale: Math.abs(shape.width / 2),
          yScale: Math.abs(shape.height / 2),
          borderColor: stroke,
          borderWidth: shape.strokeWidth,
          color: fill,
          opacity: shape.opacity || 1.0,
        });
      } else if (shape.shapeType === 'line') {
        outPage.drawLine({
          start: { x: shape.x, y: shape.y + shape.height },
          end: { x: shape.x + shape.width, y: shape.y },
          thickness: shape.strokeWidth,
          color: stroke,
          opacity: shape.opacity || 1.0,
        });
      } else if (shape.shapeType === 'arrow') {
        const startX = shape.x;
        const startY = shape.y + shape.height;
        const endX = shape.x + shape.width;
        const endY = shape.y;

        outPage.drawLine({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          thickness: shape.strokeWidth,
          color: stroke,
          opacity: shape.opacity || 1.0,
        });

        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 10;
        outPage.drawLine({
          start: { x: endX, y: endY },
          end: {
            x: endX - headLen * Math.cos(angle - Math.PI / 6),
            y: endY - headLen * Math.sin(angle - Math.PI / 6),
          },
          thickness: shape.strokeWidth,
          color: stroke,
          opacity: shape.opacity || 1.0,
        });
        outPage.drawLine({
          start: { x: endX, y: endY },
          end: {
            x: endX - headLen * Math.cos(angle + Math.PI / 6),
            y: endY - headLen * Math.sin(angle + Math.PI / 6),
          },
          thickness: shape.strokeWidth,
          color: stroke,
          opacity: shape.opacity || 1.0,
        });
      }
    }

    // 5. Apply Freehand Drawings
    const pageDrawings = documentState.drawings.filter(
      (d) => d.pageIndex === originalPageIndex
    );
    for (const drawing of pageDrawings) {
      if (drawing.points.length < 2) continue;
      const stroke = hexToRgb(drawing.strokeColor || '#000000');
      const thickness = drawing.strokeWidth || 2;
      const opacity = drawing.opacity || 1.0;

      for (let i = 0; i < drawing.points.length - 1; i++) {
        const p1 = drawing.points[i];
        const p2 = drawing.points[i + 1];
        outPage.drawLine({
          start: { x: p1.x, y: p1.y },
          end: { x: p2.x, y: p2.y },
          thickness,
          color: stroke,
          opacity,
        });
      }
    }

    // 6. Apply Added Texts
    const pageAddedTexts = documentState.addedTexts.filter(
      (t) => t.pageIndex === originalPageIndex
    );
    for (const textElem of pageAddedTexts) {
      const font = getFont(
        textElem.fontFamily,
        textElem.fontWeight === 'bold',
        textElem.fontStyle === 'italic'
      );
      const sanitized = sanitizeTextForPdf(textElem.text);
      const fontSize = textElem.fontSize || 12;
      const color = hexToRgb(textElem.color || '#000000');
      const opacity = textElem.opacity !== undefined ? textElem.opacity : 1.0;

      outPage.drawText(sanitized, {
        x: textElem.x,
        y: textElem.y,
        size: fontSize,
        font: font,
        color: color,
        opacity: opacity,
      });

      // Handle text decorations
      if (textElem.textDecoration === 'underline') {
        const textWidth = font.widthOfTextAtSize(sanitized, fontSize);
        outPage.drawLine({
          start: { x: textElem.x, y: textElem.y - 2 },
          end: { x: textElem.x + textWidth, y: textElem.y - 2 },
          thickness: 1,
          color: color,
          opacity: opacity,
        });
      } else if (textElem.textDecoration === 'line-through') {
        const textWidth = font.widthOfTextAtSize(sanitized, fontSize);
        outPage.drawLine({
          start: { x: textElem.x, y: textElem.y + fontSize * 0.35 },
          end: { x: textElem.x + textWidth, y: textElem.y + fontSize * 0.35 },
          thickness: 1,
          color: color,
          opacity: opacity,
        });
      }
    }

    // 7. Apply Stamps
    const pageStamps = documentState.stamps.filter(
      (s) => s.pageIndex === originalPageIndex
    );
    for (const stamp of pageStamps) {
      const stampColor = hexToRgb(stamp.color || '#dc2626');
      const stampText = stamp.customText || stamp.stampType;

      // Draw stamp border
      outPage.drawRectangle({
        x: stamp.x,
        y: stamp.y,
        width: stamp.width,
        height: stamp.height,
        borderColor: stampColor,
        borderWidth: 2.5,
        rotate: degrees(stamp.rotation || 0),
        color: undefined,
      });

      // Draw stamp text centered
      outPage.drawText(stampText, {
        x: stamp.x + 10,
        y: stamp.y + stamp.height * 0.3,
        size: stamp.height * 0.5,
        font: helveticaBoldFont,
        color: stampColor,
        rotate: degrees(stamp.rotation || 0),
      });
    }

    // 8. Apply Embedded Images
    const pageImages = documentState.images.filter(
      (img) => img.pageIndex === originalPageIndex
    );
    for (const img of pageImages) {
      try {
        const bytes = dataUrlToUint8Array(img.dataUrl);
        const embedded =
          img.mimeType === 'image/png'
            ? await outDoc.embedPng(bytes)
            : await outDoc.embedJpg(bytes);

        outPage.drawImage(embedded, {
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          opacity: img.opacity !== undefined ? img.opacity : 1.0,
          rotate: degrees(img.rotation || 0),
        });
      } catch (err) {
        console.error('Failed to embed image element:', err);
      }
    }

    // 9. Apply Signatures (Transparent PNGs)
    const pageSignatures = documentState.signatures.filter(
      (sig) => sig.pageIndex === originalPageIndex
    );
    for (const sig of pageSignatures) {
      try {
        const bytes = dataUrlToUint8Array(sig.dataUrl);
        const embedded = await outDoc.embedPng(bytes);

        outPage.drawImage(embedded, {
          x: sig.x,
          y: sig.y,
          width: sig.width,
          height: sig.height,
          opacity: sig.opacity !== undefined ? sig.opacity : 1.0,
          rotate: degrees(sig.rotation || 0),
        });
      } catch (err) {
        console.error('Failed to embed signature element:', err);
      }
    }
  }

  // Finalize and return genuine PDF byte stream
  return await outDoc.save();
}
