import * as pdfjsLib from 'pdfjs-dist';

export interface RenderPageOptions {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number; // 1-indexed
  canvas: HTMLCanvasElement;
  scale: number;
  rotation?: number;
}

export interface RenderResult {
  width: number;
  height: number;
  scale: number;
  renderTask: pdfjsLib.RenderTask;
}

/**
 * Renders a single PDF page to an HTMLCanvasElement with device pixel ratio scaling for crisp High-DPI display.
 */
export async function renderPDFPage({
  pdfDoc,
  pageNumber,
  canvas,
  scale,
  rotation,
}: RenderPageOptions): Promise<RenderResult> {
  const page = await pdfDoc.getPage(pageNumber);

  // Use target rotation directly in PDF.js viewport
  const targetRotation = rotation !== undefined ? rotation : page.rotate;
  const viewport = page.getViewport({ scale, rotation: targetRotation });

  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context could not be created');
  }

  // Set internal canvas resolution based on device pixel ratio
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);

  // Set visual CSS dimensions
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  // Draw white background
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Scale context to handle devicePixelRatio
  const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    transform: transform,
  };

  const renderTask = page.render(renderContext);
  await renderTask.promise;

  return {
    width: viewport.width,
    height: viewport.height,
    scale,
    renderTask,
  };
}
