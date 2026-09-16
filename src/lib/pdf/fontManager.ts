import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

export interface FontOption {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace';
  pdfLibFont: StandardFonts;
  pdfLibBoldFont: StandardFonts;
  pdfLibItalicFont: StandardFonts;
  pdfLibBoldItalicFont: StandardFonts;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'Helvetica',
    name: 'Helvetica / Arial',
    category: 'sans-serif',
    pdfLibFont: StandardFonts.Helvetica,
    pdfLibBoldFont: StandardFonts.HelveticaBold,
    pdfLibItalicFont: StandardFonts.HelveticaOblique,
    pdfLibBoldItalicFont: StandardFonts.HelveticaBoldOblique,
  },
  {
    id: 'TimesRoman',
    name: 'Times New Roman',
    category: 'serif',
    pdfLibFont: StandardFonts.TimesRoman,
    pdfLibBoldFont: StandardFonts.TimesRomanBold,
    pdfLibItalicFont: StandardFonts.TimesRomanItalic,
    pdfLibBoldItalicFont: StandardFonts.TimesRomanBoldItalic,
  },
  {
    id: 'Courier',
    name: 'Courier New',
    category: 'monospace',
    pdfLibFont: StandardFonts.Courier,
    pdfLibBoldFont: StandardFonts.CourierBold,
    pdfLibItalicFont: StandardFonts.CourierOblique,
    pdfLibBoldItalicFont: StandardFonts.CourierBoldOblique,
  },
];

/**
 * Maps a PDF.js or CSS font name to the closest StandardFonts
 */
export function matchStandardFont(
  fontName?: string,
  bold: boolean = false,
  italic: boolean = false
): StandardFonts {
  const name = (fontName || '').toLowerCase();

  let family = 'helvetica';
  if (name.includes('times') || name.includes('serif') || name.includes('georgia') || name.includes('garamond')) {
    family = 'times';
  } else if (name.includes('courier') || name.includes('mono') || name.includes('consolas')) {
    family = 'courier';
  }

  if (bold || name.includes('bold')) {
    if (italic || name.includes('italic') || name.includes('oblique')) {
      if (family === 'times') return StandardFonts.TimesRomanBoldItalic;
      if (family === 'courier') return StandardFonts.CourierBoldOblique;
      return StandardFonts.HelveticaBoldOblique;
    }
    if (family === 'times') return StandardFonts.TimesRomanBold;
    if (family === 'courier') return StandardFonts.CourierBold;
    return StandardFonts.HelveticaBold;
  }

  if (italic || name.includes('italic') || name.includes('oblique')) {
    if (family === 'times') return StandardFonts.TimesRomanItalic;
    if (family === 'courier') return StandardFonts.CourierOblique;
    return StandardFonts.HelveticaOblique;
  }

  if (family === 'times') return StandardFonts.TimesRoman;
  if (family === 'courier') return StandardFonts.Courier;
  return StandardFonts.Helvetica;
}

/**
 * Standard PDF fonts only support WinAnsi characters.
 * Non-WinAnsi characters (such as ₹ Indian Rupee, curved quotes, etc.)
 * are safely normalized to WinAnsi equivalents to prevent encoding crashes.
 */
export function sanitizeTextForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u20B9/g, 'Rs. ')     // Indian Rupee symbol -> Rs.
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes -> '
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes -> "
    .replace(/\u2014/g, '--')        // Em dash -> --
    .replace(/\u2013/g, '-')         // En dash -> -
    .replace(/\u2026/g, '...')       // Ellipsis -> ...
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?'); // Fallback non-ASCII to ?
}

export async function getOrEmbedFont(
  doc: PDFDocument,
  fontFamily: string,
  bold: boolean = false,
  italic: boolean = false
): Promise<PDFFont> {
  const stdFont = matchStandardFont(fontFamily, bold, italic);
  return await doc.embedFont(stdFont);
}
