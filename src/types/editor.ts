import type { PDFPoint, PDFRect, PageInfo } from './pdf';

export type EditorTool =
  | 'select'
  | 'editText'
  | 'addText'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'draw'
  | 'shape'
  | 'image'
  | 'signature'
  | 'stamp'
  | 'comment'
  | 'whiteout';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';

export type StampType =
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CONFIDENTIAL'
  | 'DRAFT'
  | 'COPY';

export interface TextReplacement {
  id: string;
  pageIndex: number;
  originalText: string;
  originalBounds: PDFRect; // in PDF points (bottom-left) - location of original text to whitewash
  newText: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color: string;
  backgroundColor?: string; // 'transparent' by default so it never overlays table lines
  whitewashOriginal?: boolean; // true by default to whitewash text before editing
  x?: number; // current X position of text box
  y?: number; // current Y position of text box
}

export interface AddedTextElement {
  id: string;
  pageIndex: number;
  x: number; // PDF points (bottom-left)
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color: string;
  alignment: 'left' | 'center' | 'right';
  opacity: number;
}

export interface ImageElement {
  id: string;
  pageIndex: number;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  opacity: number;
  rotation: number;
}

export interface SignatureElement {
  id: string;
  pageIndex: number;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  dataUrl: string; // transparent PNG
  opacity: number;
  rotation: number;
}

export interface DrawingElement {
  id: string;
  pageIndex: number;
  points: PDFPoint[]; // in PDF points
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface ShapeElement {
  id: string;
  pageIndex: number;
  shapeType: ShapeType;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string; // 'transparent' or hex
  strokeWidth: number;
  opacity: number;
}

export interface WhiteoutElement {
  id: string;
  pageIndex: number;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  color: string; // usually #ffffff
}

export interface StampElement {
  id: string;
  pageIndex: number;
  stampType: StampType;
  customText?: string;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
}

export interface AnnotationElement {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'comment';
  pageIndex: number;
  rects: PDFRect[]; // In PDF points
  color: string;
  opacity: number;
  author?: string;
  commentText?: string;
  createdAt?: string;
  x?: number;
  y?: number;
}

export type EditorElement =
  | ({ elementType: 'replacement' } & TextReplacement)
  | ({ elementType: 'text' } & AddedTextElement)
  | ({ elementType: 'image' } & ImageElement)
  | ({ elementType: 'signature' } & SignatureElement)
  | ({ elementType: 'drawing' } & DrawingElement)
  | ({ elementType: 'shape' } & ShapeElement)
  | ({ elementType: 'whiteout' } & WhiteoutElement)
  | ({ elementType: 'stamp' } & StampElement)
  | ({ elementType: 'annotation' } & AnnotationElement);

export interface EditorDocumentState {
  file: File | null;
  pdfBytes: Uint8Array | null;
  fileName: string;
  numPages: number;
  pages: PageInfo[];
  pageRotations: Record<number, number>; // pageIndex -> rotation degrees (0, 90, 180, 270)
  pageOrder: number[]; // indices of pages, can include negative ids for newly added blank pages
  deletedPages: number[];
  textReplacements: TextReplacement[];
  addedTexts: AddedTextElement[];
  images: ImageElement[];
  signatures: SignatureElement[];
  drawings: DrawingElement[];
  shapes: ShapeElement[];
  whiteouts: WhiteoutElement[];
  stamps: StampElement[];
  annotations: AnnotationElement[];
}

export interface HistorySnapshot {
  pageOrder: number[];
  pageRotations: Record<number, number>;
  pages: PageInfo[];
  textReplacements: TextReplacement[];
  addedTexts: AddedTextElement[];
  images: ImageElement[];
  signatures: SignatureElement[];
  drawings: DrawingElement[];
  shapes: ShapeElement[];
  whiteouts: WhiteoutElement[];
  stamps: StampElement[];
  annotations: AnnotationElement[];
}
