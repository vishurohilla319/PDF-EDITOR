import { createWorker } from 'tesseract.js';
import { PageOCRResult } from '../../types/pdf';

let ocrWorker: any = null;

async function getWorker() {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
}

/**
 * Runs OCR on a rendered canvas to extract text and bounding boxes from scanned documents
 */
export async function runOCROnCanvas(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  onProgress?: (progress: number) => void
): Promise<PageOCRResult> {
  const worker = await getWorker();

  const ret = await worker.recognize(canvas);
  const data = ret.data;

  const lines = (data.lines || []).map((line: any) => ({
    text: line.text.trim(),
    confidence: line.confidence,
    bbox: {
      x0: line.bbox.x0,
      y0: line.bbox.y0,
      x1: line.bbox.x1,
      y1: line.bbox.y1,
    },
  }));

  return {
    pageIndex,
    isScanned: true,
    text: data.text,
    lines,
  };
}
