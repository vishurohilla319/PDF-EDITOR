import { rgb, RGB } from 'pdf-lib';

/**
 * Converts standard CSS hex color (#rrggbb or #rgb) to pdf-lib RGB color object
 */
export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return rgb(0, 0, 0); // Default to black
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b
  );
}

/**
 * Default color palette for annotations and shapes
 */
export const COLOR_PALETTE = [
  '#000000', // Black
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ca8a04', // Yellow
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#ffffff', // White
];

export const HIGHLIGHT_COLORS = [
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#bfdbfe', // Blue
  '#fbcfe8', // Pink
  '#fed7aa', // Orange
];
