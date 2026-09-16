import * as pdfjsLib from 'pdfjs-dist';
import { PageInfo } from '../../types/pdf';

// Ensure worker is configured
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface LoadedPDF {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  numPages: number;
  pages: PageInfo[];
  pdfBytes: Uint8Array;
}

/**
 * Validates that an ArrayBuffer starts with %PDF- header
 */
export function validatePDFHeader(buffer: ArrayBufferLike): boolean {
  if (buffer.byteLength < 5) return false;
  const headerBytes = new Uint8Array(buffer.slice(0, 5));
  const header = String.fromCharCode(...headerBytes);
  return header.startsWith('%PDF-');
}

/**
 * Loads a PDF from Uint8Array or ArrayBuffer and extracts page metadata
 */
export async function loadPDFDocument(data: ArrayBuffer | Uint8Array): Promise<LoadedPDF> {
  const pdfBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (!validatePDFHeader(pdfBytes.buffer)) {
    throw new Error('Invalid PDF file: Missing %PDF header. Please ensure you uploaded a genuine PDF.');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes.slice(),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: PageInfo[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      pageIndex: i - 1,
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
      originalPageIndex: i - 1,
    });
  }

  return {
    pdfDoc,
    numPages,
    pages,
    pdfBytes,
  };
}

/**
 * Reads a File object as Uint8Array
 */
export async function readFileAsArrayBuffer(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
