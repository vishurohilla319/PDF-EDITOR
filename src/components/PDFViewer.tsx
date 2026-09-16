import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageInfo } from '../types/pdf';
import {
  EditorTool,
  TextReplacement,
  AddedTextElement,
  ImageElement,
  SignatureElement,
  DrawingElement,
  ShapeElement,
  WhiteoutElement,
  StampElement,
  AnnotationElement,
} from '../types/editor';
import { PDFPage } from './PDFPage';
import { SelectedItem } from '../hooks/useSelection';
import { AlertCircle, ScanText } from 'lucide-react';

interface PDFViewerProps {
  pages: PageInfo[];
  pageOrder: number[];
  pageRotations: Record<number, number>;
  currentPageIndex: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  activeTool: EditorTool;
  // Elements
  textReplacements: TextReplacement[];
  addedTexts: AddedTextElement[];
  images: ImageElement[];
  signatures: SignatureElement[];
  drawings: DrawingElement[];
  shapes: ShapeElement[];
  whiteouts: WhiteoutElement[];
  stamps: StampElement[];
  annotations: AnnotationElement[];
  // Selection
  selectedItem: SelectedItem | null;
  onSelectElement: (id: string, type: any, pageIndex: number) => void;
  onClearSelection: () => void;
  // Mutations
  onAddTextReplacement: (replacement: TextReplacement) => void;
  onAddText: (elem: AddedTextElement) => void;
  onAddDrawing: (drawing: DrawingElement) => void;
  onAddShape: (shape: ShapeElement) => void;
  onAddWhiteout: (whiteout: WhiteoutElement) => void;
  onAddAnnotation: (ann: AnnotationElement) => void;
  onUpdateElementPosition: (id: string, type: string, x: number, y: number) => void;
  onSelectPage: (index: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pages,
  pageOrder,
  pageRotations,
  currentPageIndex,
  pdfDoc,
  scale,
  activeTool,
  textReplacements,
  addedTexts,
  images,
  signatures,
  drawings,
  shapes,
  whiteouts,
  stamps,
  annotations,
  selectedItem,
  onSelectElement,
  onClearSelection,
  onAddTextReplacement,
  onAddText,
  onAddDrawing,
  onAddShape,
  onAddWhiteout,
  onAddAnnotation,
  onUpdateElementPosition,
  onSelectPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to active page when changed from thumbnail sidebar
  useEffect(() => {
    if (pageRefs.current[currentPageIndex]) {
      pageRefs.current[currentPageIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentPageIndex]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-950 overflow-y-auto overflow-x-auto p-8 relative flex flex-col items-center select-none"
    >
      {/* Informational tool hint banner */}
      {activeTool === 'editText' && (
        <div className="sticky top-2 z-40 bg-blue-600/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-blue-400/40 flex items-center gap-2 mb-4 animate-fade-in">
          <ScanText className="w-4 h-4 text-amber-300" />
          <span>Click any text on the page to edit it directly. The original text will be seamlessly replaced.</span>
        </div>
      )}

      {/* Pages Container */}
      <div className="space-y-12">
        {pageOrder.map((pageId, orderIndex) => {
          const pageInfo = pages.find((p) => p.pageIndex === pageId);
          if (!pageInfo) return null;

          const rotatedInfo: PageInfo = {
            ...pageInfo,
            rotation:
              pageRotations[pageId] !== undefined ? pageRotations[pageId] : pageInfo.rotation,
          };

          return (
            <div
              key={`page-container-${pageId}-${orderIndex}`}
              ref={(el) => {
                pageRefs.current[orderIndex] = el;
              }}
              onClick={() => onSelectPage(orderIndex)}
              className="flex flex-col items-center"
            >
              {/* Page Number Label */}
              <div className="text-xs text-slate-500 mb-2 font-medium">
                Page {orderIndex + 1} of {pageOrder.length}
              </div>

              <PDFPage
                page={rotatedInfo}
                pageOrderIndex={orderIndex}
                pdfDoc={pdfDoc}
                scale={scale}
                activeTool={activeTool}
                textReplacements={textReplacements}
                addedTexts={addedTexts}
                images={images}
                signatures={signatures}
                drawings={drawings}
                shapes={shapes}
                whiteouts={whiteouts}
                stamps={stamps}
                annotations={annotations}
                selectedItem={selectedItem}
                onSelectElement={onSelectElement}
                onClearSelection={onClearSelection}
                onAddTextReplacement={onAddTextReplacement}
                onAddText={onAddText}
                onAddDrawing={onAddDrawing}
                onAddShape={onAddShape}
                onAddWhiteout={onAddWhiteout}
                onAddAnnotation={onAddAnnotation}
                onUpdateElementPosition={onUpdateElementPosition}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
