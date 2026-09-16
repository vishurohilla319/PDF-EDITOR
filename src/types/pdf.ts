export interface PDFPoint {
  x: number;
  y: number;
}

export interface PDFRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFTextItem {
  id: string;
  str: string;
  pageIndex: number;
  /** Bounding box in PDF coordinate space (points, bottom-left origin) */
  bounds: PDFRect;
  fontSize: number;
  fontName?: string;
  fontFamily?: string;
  color?: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
}

export interface PageInfo {
  pageIndex: number;
  pageNumber: number;
  width: number;       // PDF points
  height: number;      // PDF points
  rotation: number;    // 0, 90, 180, 270
  originalPageIndex: number;
  isCustomBlank?: boolean;
}

export interface OCRBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRLine {
  text: string;
  bbox: OCRBoundingBox;
  confidence: number;
}

export interface PageOCRResult {
  pageIndex: number;
  isScanned: boolean;
  text: string;
  lines: OCRLine[];
}
