import { PDFPoint, PDFRect, CanvasPoint, CanvasRect } from '../../types/pdf';

/**
 * Converts a point from PDF coordinates (bottom-left origin, 72 dpi)
 * to Canvas / Viewport coordinates (top-left origin, scaled).
 */
export function pdfToCanvas(
  point: PDFPoint,
  pageHeight: number,
  scale: number,
  rotation: number = 0,
  pageWidth: number = 0
): CanvasPoint {
  const normRot = ((rotation % 360) + 360) % 360;

  if (normRot === 0) {
    return {
      x: point.x * scale,
      y: (pageHeight - point.y) * scale,
    };
  } else if (normRot === 90) {
    return {
      x: point.y * scale,
      y: point.x * scale,
    };
  } else if (normRot === 180) {
    return {
      x: (pageWidth - point.x) * scale,
      y: point.y * scale,
    };
  } else if (normRot === 270) {
    return {
      x: (pageHeight - point.y) * scale,
      y: (pageWidth - point.x) * scale,
    };
  }

  return {
    x: point.x * scale,
    y: (pageHeight - point.y) * scale,
  };
}

/**
 * Converts a point from Canvas coordinates (top-left origin, scaled)
 * to PDF coordinates (bottom-left origin, 72 dpi).
 */
export function canvasToPdf(
  point: CanvasPoint,
  pageHeight: number,
  scale: number,
  rotation: number = 0,
  pageWidth: number = 0
): PDFPoint {
  const normRot = ((rotation % 360) + 360) % 360;
  const unscaledX = point.x / scale;
  const unscaledY = point.y / scale;

  if (normRot === 0) {
    return {
      x: unscaledX,
      y: pageHeight - unscaledY,
    };
  } else if (normRot === 90) {
    return {
      x: unscaledY,
      y: unscaledX,
    };
  } else if (normRot === 180) {
    return {
      x: pageWidth - unscaledX,
      y: unscaledY,
    };
  } else if (normRot === 270) {
    return {
      x: pageWidth - unscaledY,
      y: pageHeight - unscaledX,
    };
  }

  return {
    x: unscaledX,
    y: pageHeight - unscaledY,
  };
}

/**
 * Converts a rectangle from PDF coordinates (bottom-left origin)
 * to Canvas coordinates (top-left origin).
 */
export function pdfRectToCanvasRect(
  rect: PDFRect,
  pageHeight: number,
  scale: number
): CanvasRect {
  return {
    x: rect.x * scale,
    y: (pageHeight - (rect.y + rect.height)) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/**
 * Converts a rectangle from Canvas coordinates (top-left origin)
 * to PDF coordinates (bottom-left origin).
 */
export function canvasRectToPdfRect(
  rect: CanvasRect,
  pageHeight: number,
  scale: number
): PDFRect {
  const w = rect.width / scale;
  const h = rect.height / scale;
  const x = rect.x / scale;
  const y = pageHeight - (rect.y + rect.height) / scale;

  return {
    x,
    y,
    width: w,
    height: h,
  };
}

/**
 * Screen (client mouse event) coordinates to PDF coordinates
 */
export function screenToPdf(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  pageHeight: number,
  scale: number,
  rotation: number = 0,
  pageWidth: number = 0
): PDFPoint {
  const canvasPoint: CanvasPoint = {
    x: clientX - containerRect.left,
    y: clientY - containerRect.top,
  };
  return canvasToPdf(canvasPoint, pageHeight, scale, rotation, pageWidth);
}

/**
 * PDF coordinates to Screen (client window) coordinates
 */
export function pdfToScreen(
  point: PDFPoint,
  containerRect: DOMRect,
  pageHeight: number,
  scale: number,
  rotation: number = 0,
  pageWidth: number = 0
): CanvasPoint {
  const canvasPoint = pdfToCanvas(point, pageHeight, scale, rotation, pageWidth);
  return {
    x: containerRect.left + canvasPoint.x,
    y: containerRect.top + canvasPoint.y,
  };
}
