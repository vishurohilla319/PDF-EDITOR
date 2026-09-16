import * as pdfjsLib from 'pdfjs-dist';
import { PDFTextItem } from '../../types/pdf';

/**
 * Extracts text content items from a PDF.js PageProxy with accurate PDF bounding boxes.
 */
export async function extractTextItemsFromPage(
  page: pdfjsLib.PDFPageProxy,
  pageIndex: number
): Promise<PDFTextItem[]> {
  const textContent = await page.getTextContent();
  const items: PDFTextItem[] = [];

  let itemIdCounter = 0;

  for (const item of textContent.items) {
    // Only process TextItem (has 'str' property)
    if (!('str' in item)) continue;
    const str = item.str;
    if (!str || str.trim().length === 0) continue;

    const transform = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
    const tx = transform[4];
    const ty = transform[5];

    // Compute approximate font size from transformation matrix
    const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]) || 12;
    const fontHeight = item.height && item.height > 0 ? item.height : fontSize;
    const width = item.width && item.width > 0 ? item.width : str.length * (fontSize * 0.55);

    // In PDF space, baseline is at ty. The text box extends upward by fontHeight,
    // and slightly below baseline for descenders (~20% of font size).
    const descenderOffset = fontSize * 0.15;
    const bounds = {
      x: tx,
      y: ty - descenderOffset,
      width: width,
      height: fontHeight + descenderOffset,
    };

    items.push({
      id: `text-${pageIndex}-${itemIdCounter++}`,
      str,
      pageIndex,
      bounds,
      fontSize,
      fontName: item.fontName,
      transform,
    });
  }

  return items;
}

/**
 * Checks whether a page has meaningful text or is likely a scanned image.
 */
export async function detectIfPageIsScanned(page: pdfjsLib.PDFPageProxy): Promise<boolean> {
  try {
    const textContent = await page.getTextContent();
    const meaningfulItems = textContent.items.filter(
      (item) => 'str' in item && item.str.trim().length > 0
    );
    // If fewer than 2 text items exist, page is likely a scanned document/image
    return meaningfulItems.length < 2;
  } catch {
    return false;
  }
}
