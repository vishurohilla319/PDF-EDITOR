/**
 * Samples the true document background color around a text item from the rendered canvas.
 * Samples along the outer margin and corners of the bounding box to find the dominant
 * background color (whether white, scanned paper, cream, colored table cell, or dark header).
 */
export function sampleDocumentBackgroundColor(
  canvas: HTMLCanvasElement | null,
  rect: { x: number; y: number; width: number; height: number },
  displayWidth: number,
  displayHeight: number
): string {
  if (!canvas || !canvas.width || !canvas.height) return '#ffffff';

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#ffffff';

    const scaleX = canvas.width / (displayWidth || canvas.width);
    const scaleY = canvas.height / (displayHeight || canvas.height);

    // Generate sample coordinates along the 4 boundaries and corners
    const samplePoints: { x: number; y: number }[] = [];

    const minX = Math.max(0, rect.x - 1);
    const maxX = Math.min(displayWidth, rect.x + rect.width + 1);
    const minY = Math.max(0, rect.y - 1);
    const maxY = Math.min(displayHeight, rect.y + rect.height + 1);

    // Corners
    samplePoints.push({ x: minX, y: minY });
    samplePoints.push({ x: maxX, y: minY });
    samplePoints.push({ x: minX, y: maxY });
    samplePoints.push({ x: maxX, y: maxY });

    // Midpoints along 4 edges
    samplePoints.push({ x: (minX + maxX) * 0.5, y: minY });
    samplePoints.push({ x: (minX + maxX) * 0.5, y: maxY });
    samplePoints.push({ x: minX, y: (minY + maxY) * 0.5 });
    samplePoints.push({ x: maxX, y: (minY + maxY) * 0.5 });

    // Quarters along top and bottom edges (where text ascenders/descenders rarely touch)
    samplePoints.push({ x: minX + (maxX - minX) * 0.25, y: minY });
    samplePoints.push({ x: minX + (maxX - minX) * 0.75, y: minY });
    samplePoints.push({ x: minX + (maxX - minX) * 0.25, y: maxY });
    samplePoints.push({ x: minX + (maxX - minX) * 0.75, y: maxY });

    // Collect color samples
    const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
    let fallbackR = 255,
      fallbackG = 255,
      fallbackB = 255;

    for (const pt of samplePoints) {
      const px = Math.floor(pt.x * scaleX);
      const py = Math.floor(pt.y * scaleY);

      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        const data = ctx.getImageData(px, py, 1, 1).data;
        const r = data[0];
        const g = data[1];
        const b = data[2];
        const a = data[3];

        if (a < 10) continue; // transparent pixel

        // Round color slightly to group near-identical anti-aliased shades
        const roundedKey = `${Math.round(r / 4) * 4},${Math.round(g / 4) * 4},${Math.round(b / 4) * 4}`;

        if (!colorCounts[roundedKey]) {
          colorCounts[roundedKey] = { count: 0, r, g, b };
        }
        colorCounts[roundedKey].count += 1;
        fallbackR = r;
        fallbackG = g;
        fallbackB = b;
      }
    }

    // Find dominant background color
    let maxCount = 0;
    let dominantColor = { r: fallbackR, g: fallbackG, b: fallbackB };

    for (const key in colorCounts) {
      if (colorCounts[key].count > maxCount) {
        maxCount = colorCounts[key].count;
        dominantColor = colorCounts[key];
      }
    }

    // Convert to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`;
  } catch (err) {
    return '#ffffff';
  }
}
