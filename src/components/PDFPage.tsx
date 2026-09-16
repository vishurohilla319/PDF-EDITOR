import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  PageInfo,
  PDFTextItem,
  PDFRect,
  CanvasPoint,
} from '../types/pdf';
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
  ShapeType,
} from '../types/editor';
import { renderPDFPage } from '../lib/pdf/pdfRenderer';
import { extractTextItemsFromPage } from '../lib/pdf/textExtractor';
import {
  pdfToCanvas,
  canvasToPdf,
  pdfRectToCanvasRect,
  canvasRectToPdfRect,
} from '../lib/pdf/coordinateSystem';
import { InlineTextEditor } from './TextEditor';
import { SelectedItem } from '../hooks/useSelection';
import { Move } from 'lucide-react';

interface PDFPageProps {
  page: PageInfo;
  pageOrderIndex: number;
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
}

export const PDFPage: React.FC<PDFPageProps> = ({
  page,
  pageOrderIndex,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [textItems, setTextItems] = useState<PDFTextItem[]>([]);
  const [editingTextItem, setEditingTextItem] = useState<{
    item: PDFTextItem;
    canvasX: number;
    canvasY: number;
    width: number;
    height: number;
  } | null>(null);

  const [addingTextPos, setAddingTextPos] = useState<{ x: number; y: number } | null>(null);

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<CanvasPoint[]>([]);

  // Drag-to-create shape / whiteout / highlight state
  const [dragStart, setDragStart] = useState<CanvasPoint | null>(null);
  const [dragCurrent, setDragCurrent] = useState<CanvasPoint | null>(null);

  // Moving selected element state
  const [movingElem, setMovingElem] = useState<{
    id: string;
    type: string;
    startX: number;
    startY: number;
    origPdfX: number;
    origPdfY: number;
  } | null>(null);

  // 1. Render PDF page canvas
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current) return;

      if (page.originalPageIndex < 0) {
        // Blank page - draw crisp white background
        const canvas = canvasRef.current;
        const width = page.width * scale;
        const height = page.height * scale;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        setTextItems([]);
        return;
      }

      if (!pdfDoc) return;

      try {
        const res = await renderPDFPage({
          pdfDoc,
          pageNumber: page.originalPageIndex + 1,
          canvas: canvasRef.current,
          scale,
          rotation: page.rotation,
        });

        if (isCancelled) return;
        setRenderedDims({ width: res.width, height: res.height });

        // Extract text layer items for interactive editing
        const pdfPage = await pdfDoc.getPage(page.originalPageIndex + 1);
        const extracted = await extractTextItemsFromPage(pdfPage, page.pageIndex);
        if (!isCancelled) {
          setTextItems(extracted);
        }
      } catch (err) {
        // Handled / cancelled
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, page.originalPageIndex, page.rotation, scale, page.width, page.height]);

  const [renderedDims, setRenderedDims] = useState<{ width: number; height: number }>({
    width: ((page.rotation === 90 || page.rotation === 270) ? page.height : page.width) * scale,
    height: ((page.rotation === 90 || page.rotation === 270) ? page.width : page.height) * scale,
  });

  const displayWidth = renderedDims.width;
  const displayHeight = renderedDims.height;

  // Handle Freehand Drawing Canvas
  useEffect(() => {
    const drawCanvas = drawingCanvasRef.current;
    if (!drawCanvas) return;
    drawCanvas.width = displayWidth;
    drawCanvas.height = displayHeight;
  }, [displayWidth, displayHeight]);

  // Dedicated element drag-move handler with window listeners for smooth, jitter-free dragging
  const startDraggingElement = (
    e: React.MouseEvent,
    id: string,
    type: string,
    origPdfX: number,
    origPdfY: number
  ) => {
    e.stopPropagation();
    onSelectElement(id, type, page.pageIndex);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    document.body.style.userSelect = 'none';

    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      const deltaScreenX = moveEvent.clientX - startClientX;
      const deltaScreenY = moveEvent.clientY - startClientY;

      // Handle page rotation dynamically so dragging right always moves right on screen
      const normRot = ((page.rotation % 360) + 360) % 360;
      let newPdfX = origPdfX;
      let newPdfY = origPdfY;

      if (normRot === 0) {
        newPdfX = origPdfX + deltaScreenX / scale;
        newPdfY = origPdfY - deltaScreenY / scale;
      } else if (normRot === 90) {
        newPdfX = origPdfX + deltaScreenY / scale;
        newPdfY = origPdfY + deltaScreenX / scale;
      } else if (normRot === 180) {
        newPdfX = origPdfX - deltaScreenX / scale;
        newPdfY = origPdfY + deltaScreenY / scale;
      } else if (normRot === 270) {
        newPdfX = origPdfX - deltaScreenY / scale;
        newPdfY = origPdfY - deltaScreenX / scale;
      }

      onUpdateElementPosition(id, type, Math.round(newPdfX), Math.round(newPdfY));
    };

    const handleGlobalMouseUp = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPoint: CanvasPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (activeTool === 'draw') {
      setIsDrawing(true);
      currentPathRef.current = [canvasPoint];
    } else if (
      activeTool === 'shape' ||
      activeTool === 'whiteout' ||
      activeTool === 'highlight'
    ) {
      setDragStart(canvasPoint);
      setDragCurrent(canvasPoint);
    } else if (activeTool === 'addText') {
      setAddingTextPos(canvasPoint);
    } else if (activeTool === 'select') {
      // If clicked background, clear selection
      if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
        onClearSelection();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPoint: CanvasPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (isDrawing && activeTool === 'draw') {
      currentPathRef.current.push(canvasPoint);
      const drawCanvas = drawingCanvasRef.current;
      const ctx = drawCanvas?.getContext('2d');
      if (ctx && currentPathRef.current.length > 1) {
        const pts = currentPathRef.current;
        const p1 = pts[pts.length - 2];
        const p2 = pts[pts.length - 1];
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    } else if (dragStart) {
      setDragCurrent(canvasPoint);
    } else if (movingElem) {
      const deltaX = (canvasPoint.x - movingElem.startX) / scale;
      const deltaY = -(canvasPoint.y - movingElem.startY) / scale; // PDF Y is inverted
      onUpdateElementPosition(
        movingElem.id,
        movingElem.type,
        movingElem.origPdfX + deltaX,
        movingElem.origPdfY + deltaY
      );
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      if (currentPathRef.current.length > 1) {
        // Convert canvas points to PDF points
        const pdfPoints = currentPathRef.current.map((pt) =>
          canvasToPdf(pt, page.height, scale)
        );
        onAddDrawing({
          id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          pageIndex: page.pageIndex,
          points: pdfPoints,
          strokeColor: '#2563eb',
          strokeWidth: 2.5,
          opacity: 1.0,
        });
      }
      currentPathRef.current = [];
      const drawCanvas = drawingCanvasRef.current;
      const ctx = drawCanvas?.getContext('2d');
      ctx?.clearRect(0, 0, displayWidth, displayHeight);
    } else if (dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);

      if (width > 5 && height > 5) {
        const pdfRect = canvasRectToPdfRect({ x, y, width, height }, page.height, scale);

        if (activeTool === 'whiteout') {
          onAddWhiteout({
            id: `whiteout-${Date.now()}`,
            pageIndex: page.pageIndex,
            x: pdfRect.x,
            y: pdfRect.y,
            width: pdfRect.width,
            height: pdfRect.height,
            color: '#ffffff',
          });
        } else if (activeTool === 'highlight') {
          onAddAnnotation({
            id: `highlight-${Date.now()}`,
            pageIndex: page.pageIndex,
            type: 'highlight',
            rects: [pdfRect],
            color: '#fef08a',
            opacity: 0.35,
          });
        } else if (activeTool === 'shape') {
          onAddShape({
            id: `shape-${Date.now()}`,
            pageIndex: page.pageIndex,
            shapeType: 'rectangle',
            x: pdfRect.x,
            y: pdfRect.y,
            width: pdfRect.width,
            height: pdfRect.height,
            strokeColor: '#2563eb',
            fillColor: 'transparent',
            strokeWidth: 2,
            opacity: 1.0,
          });
        }
      }

      setDragStart(null);
      setDragCurrent(null);
    }

    if (movingElem) {
      setMovingElem(null);
    }
  };

  // Click on existing text item when EDIT TEXT is active
  const handleTextItemClick = (item: PDFTextItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'editText') {
      const cRect = pdfRectToCanvasRect(item.bounds, page.height, scale);
      setEditingTextItem({
        item,
        canvasX: cRect.x,
        canvasY: cRect.y,
        width: cRect.width,
        height: cRect.height,
      });
    } else if (activeTool === 'highlight') {
      onAddAnnotation({
        id: `highlight-${Date.now()}`,
        pageIndex: page.pageIndex,
        type: 'highlight',
        rects: [item.bounds],
        color: '#fef08a',
        opacity: 0.35,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      className={`relative mx-auto my-6 bg-white shadow-2xl rounded select-none ${
        activeTool === 'draw' || activeTool === 'shape' || activeTool === 'whiteout'
          ? 'cursor-crosshair'
          : activeTool === 'editText' || activeTool === 'addText'
          ? 'cursor-text'
          : 'cursor-default'
      }`}
    >
      {/* 1. Underlying PDF Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />

      {/* 2. Interactive Text Layer for Existing Text Selection / Edit */}
      {activeTool === 'editText' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {textItems.map((item) => {
            // Check if this text item is already replaced
            const isReplaced = textReplacements.some(
              (r) =>
                r.pageIndex === page.pageIndex &&
                Math.abs(r.originalBounds.x - item.bounds.x) < 2 &&
                Math.abs(r.originalBounds.y - item.bounds.y) < 2
            );
            if (isReplaced) return null;

            const cRect = pdfRectToCanvasRect(item.bounds, page.height, scale);
            return (
              <div
                key={item.id}
                onClick={(e) => handleTextItemClick(item, e)}
                style={{
                  left: `${cRect.x}px`,
                  top: `${cRect.y}px`,
                  width: `${cRect.width}px`,
                  height: `${cRect.height}px`,
                }}
                className="absolute pointer-events-auto cursor-text hover:bg-blue-500/20 hover:border hover:border-blue-400 rounded-sm transition"
                title="Click to edit this text"
              />
            );
          })}
        </div>
      )}

      {/* 3. Whiteouts (Opaque background covers) */}
      {whiteouts
        .filter((w) => w.pageIndex === page.pageIndex)
        .map((w) => {
          const cRect = pdfRectToCanvasRect(
            { x: w.x, y: w.y, width: w.width, height: w.height },
            page.height,
            scale
          );
          const isSelected = selectedItem?.id === w.id;
          return (
            <div
              key={w.id}
              onMouseDown={(e) => startDraggingElement(e, w.id, 'whiteout', w.x, w.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(w.id, 'whiteout', page.pageIndex);
              }}
              style={{
                left: `${cRect.x}px`,
                top: `${cRect.y}px`,
                width: `${cRect.width}px`,
                height: `${cRect.height}px`,
                backgroundColor: w.color || '#ffffff',
              }}
              className={`absolute z-15 cursor-grab active:cursor-grabbing ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'border border-dashed border-slate-300'
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, w.id, 'whiteout', w.x, w.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
            </div>
          );
        })}

      {/* 4. Text Replacements Layer (Whitewash original text + transparent text box) */}
      {textReplacements
        .filter((r) => r.pageIndex === page.pageIndex)
        .map((r) => {
          const posX = r.x !== undefined ? r.x : r.originalBounds.x;
          const posY = r.y !== undefined ? r.y : r.originalBounds.y;

          const textBounds = {
            x: posX,
            y: posY,
            width: r.originalBounds.width,
            height: r.originalBounds.height,
          };

          const cRect = pdfRectToCanvasRect(textBounds, page.height, scale);
          const origRect = pdfRectToCanvasRect(r.originalBounds, page.height, scale);
          const isSelected = selectedItem?.id === r.id;

          const coverColor =
            r.backgroundColor && r.backgroundColor !== 'transparent'
              ? r.backgroundColor
              : '#ffffff';

          return (
            <React.Fragment key={r.id}>
              {/* Step A: Whitewash cover over original text before edit */}
              {r.whitewashOriginal !== false && (
                <div
                  style={{
                    left: `${origRect.x}px`,
                    top: `${origRect.y}px`,
                    width: `${origRect.width}px`,
                    height: `${origRect.height}px`,
                    backgroundColor: coverColor,
                  }}
                  className="absolute z-14 pointer-events-none"
                />
              )}

              {/* Step B: Interactive Transparent Text Box */}
              <div
                onMouseDown={(e) =>
                  startDraggingElement(e, r.id, 'replacement', posX, posY)
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(r.id, 'replacement', page.pageIndex);
                }}
                style={{
                  left: `${cRect.x}px`,
                  top: `${cRect.y}px`,
                  minWidth: `${cRect.width}px`,
                  height: `${cRect.height}px`,
                  backgroundColor: 'transparent',
                  color: r.color || '#000000',
                  fontSize: `${r.fontSize * scale}px`,
                  fontWeight: r.fontWeight || 'normal',
                  fontStyle: r.fontStyle || 'normal',
                  fontFamily: r.fontFamily,
                  lineHeight: `${cRect.height}px`,
                }}
                className={`absolute z-20 px-0.5 cursor-grab active:cursor-grabbing whitespace-nowrap select-none transition ${
                  isSelected ? 'ring-2 ring-blue-500 rounded shadow-md' : 'hover:outline hover:outline-blue-400'
                }`}
              >
                {isSelected && (
                  <div
                    onMouseDown={(e) =>
                      startDraggingElement(e, r.id, 'replacement', posX, posY)
                    }
                    className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none"
                  >
                    <Move className="w-2.5 h-2.5" />
                    <span>DRAG TO MOVE</span>
                  </div>
                )}
                {r.newText}
              </div>
            </React.Fragment>
          );
        })}

      {/* 5. Highlights, Underlines, Strikethroughs */}
      {annotations
        .filter((a) => a.pageIndex === page.pageIndex)
        .map((ann) => {
          return ann.rects.map((rect, idx) => {
            const cRect = pdfRectToCanvasRect(rect, page.height, scale);
            if (ann.type === 'highlight') {
              return (
                <div
                  key={`${ann.id}-${idx}`}
                  style={{
                    left: `${cRect.x}px`,
                    top: `${cRect.y}px`,
                    width: `${cRect.width}px`,
                    height: `${cRect.height}px`,
                    backgroundColor: ann.color || '#fef08a',
                    opacity: ann.opacity || 0.35,
                  }}
                  className="absolute z-10 pointer-events-none mix-blend-multiply"
                />
              );
            }
            if (ann.type === 'underline') {
              return (
                <div
                  key={`${ann.id}-${idx}`}
                  style={{
                    left: `${cRect.x}px`,
                    top: `${cRect.y + cRect.height}px`,
                    width: `${cRect.width}px`,
                    height: '2px',
                    backgroundColor: ann.color || '#2563eb',
                  }}
                  className="absolute z-10 pointer-events-none"
                />
              );
            }
            if (ann.type === 'strikethrough') {
              return (
                <div
                  key={`${ann.id}-${idx}`}
                  style={{
                    left: `${cRect.x}px`,
                    top: `${cRect.y + cRect.height * 0.5}px`,
                    width: `${cRect.width}px`,
                    height: '2px',
                    backgroundColor: ann.color || '#dc2626',
                  }}
                  className="absolute z-10 pointer-events-none"
                />
              );
            }
            return null;
          });
        })}

      {/* 6. Shapes Layer */}
      {shapes
        .filter((s) => s.pageIndex === page.pageIndex)
        .map((s) => {
          const cRect = pdfRectToCanvasRect(
            { x: s.x, y: s.y, width: s.width, height: s.height },
            page.height,
            scale
          );
          const isSelected = selectedItem?.id === s.id;

          return (
            <div
              key={s.id}
              onMouseDown={(e) => startDraggingElement(e, s.id, 'shape', s.x, s.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(s.id, 'shape', page.pageIndex);
              }}
              style={{
                left: `${cRect.x}px`,
                top: `${cRect.y}px`,
                width: `${cRect.width}px`,
                height: `${cRect.height}px`,
                borderColor: s.strokeColor,
                borderWidth: `${s.strokeWidth * scale}px`,
                backgroundColor: s.fillColor !== 'transparent' ? s.fillColor : 'transparent',
                borderRadius: s.shapeType === 'circle' ? '9999px' : '0px',
                opacity: s.opacity || 1.0,
              }}
              className={`absolute border z-18 cursor-grab active:cursor-grabbing ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:border-blue-400'
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, s.id, 'shape', s.x, s.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none whitespace-nowrap"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
            </div>
          );
        })}

      {/* 7. Added Texts Layer */}
      {addedTexts
        .filter((t) => t.pageIndex === page.pageIndex)
        .map((t) => {
          const cPoint = pdfToCanvas({ x: t.x, y: t.y }, page.height, scale);
          const isSelected = selectedItem?.id === t.id;

          return (
            <div
              key={t.id}
              onMouseDown={(e) => startDraggingElement(e, t.id, 'text', t.x, t.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(t.id, 'text', page.pageIndex);
              }}
              style={{
                left: `${cPoint.x}px`,
                top: `${cPoint.y - t.fontSize * scale}px`,
                color: t.color,
                fontSize: `${t.fontSize * scale}px`,
                fontWeight: t.fontWeight || 'normal',
                fontStyle: t.fontStyle || 'normal',
                textDecoration: t.textDecoration || 'none',
                opacity: t.opacity || 1.0,
                fontFamily: t.fontFamily,
              }}
              className={`absolute z-20 cursor-grab active:cursor-grabbing whitespace-pre-wrap select-none p-1 transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500 rounded bg-blue-500/10 shadow-md' : 'hover:outline hover:outline-blue-400 hover:outline-1 rounded'
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, t.id, 'text', t.x, t.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none whitespace-nowrap"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
              {t.text}
            </div>
          );
        })}

      {/* 8. Signatures Layer */}
      {signatures
        .filter((sig) => sig.pageIndex === page.pageIndex)
        .map((sig) => {
          const cRect = pdfRectToCanvasRect(
            { x: sig.x, y: sig.y, width: sig.width, height: sig.height },
            page.height,
            scale
          );
          const isSelected = selectedItem?.id === sig.id;

          return (
            <div
              key={sig.id}
              onMouseDown={(e) => startDraggingElement(e, sig.id, 'signature', sig.x, sig.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(sig.id, 'signature', page.pageIndex);
              }}
              style={{
                left: `${cRect.x}px`,
                top: `${cRect.y}px`,
                width: `${cRect.width}px`,
                height: `${cRect.height}px`,
                opacity: sig.opacity || 1.0,
                transform: `rotate(${sig.rotation || 0}deg)`,
              }}
              className={`absolute z-20 cursor-grab active:cursor-grabbing ${
                isSelected ? 'ring-2 ring-blue-500 rounded p-1 shadow-md' : 'hover:outline hover:outline-blue-400'
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, sig.id, 'signature', sig.x, sig.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none whitespace-nowrap"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
              <img
                src={sig.dataUrl}
                alt="Signature"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          );
        })}

      {/* 9. Images Layer */}
      {images
        .filter((img) => img.pageIndex === page.pageIndex)
        .map((img) => {
          const cRect = pdfRectToCanvasRect(
            { x: img.x, y: img.y, width: img.width, height: img.height },
            page.height,
            scale
          );
          const isSelected = selectedItem?.id === img.id;

          return (
            <div
              key={img.id}
              onMouseDown={(e) => startDraggingElement(e, img.id, 'image', img.x, img.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(img.id, 'image', page.pageIndex);
              }}
              style={{
                left: `${cRect.x}px`,
                top: `${cRect.y}px`,
                width: `${cRect.width}px`,
                height: `${cRect.height}px`,
                opacity: img.opacity || 1.0,
                transform: `rotate(${img.rotation || 0}deg)`,
              }}
              className={`absolute z-20 cursor-grab active:cursor-grabbing ${
                isSelected ? 'ring-2 ring-blue-500 rounded shadow-md' : 'hover:outline hover:outline-blue-400'
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, img.id, 'image', img.x, img.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none whitespace-nowrap"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
              <img
                src={img.dataUrl}
                alt="Document Graphic"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          );
        })}

      {/* 10. Freehand Drawings Layer */}
      <svg
        className="absolute inset-0 pointer-events-none z-16"
        width={displayWidth}
        height={displayHeight}
      >
        {drawings
          .filter((d) => d.pageIndex === page.pageIndex)
          .map((d) => {
            const canvasPts = d.points.map((pt) => pdfToCanvas(pt, page.height, scale));
            const pathData = canvasPts.reduce(
              (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
              ''
            );
            return (
              <path
                key={d.id}
                d={pathData}
                stroke={d.strokeColor}
                strokeWidth={d.strokeWidth * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={d.opacity || 1.0}
              />
            );
          })}
      </svg>

      {/* 11. Stamps Layer */}
      {stamps
        .filter((st) => st.pageIndex === page.pageIndex)
        .map((st) => {
          const cRect = pdfRectToCanvasRect(
            { x: st.x, y: st.y, width: st.width, height: st.height },
            page.height,
            scale
          );
          const isSelected = selectedItem?.id === st.id;

          return (
            <div
              key={st.id}
              onMouseDown={(e) => startDraggingElement(e, st.id, 'stamp', st.x, st.y)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(st.id, 'stamp', page.pageIndex);
              }}
              style={{
                left: `${cRect.x}px`,
                top: `${cRect.y}px`,
                width: `${cRect.width}px`,
                height: `${cRect.height}px`,
                borderColor: st.color,
                color: st.color,
                transform: `rotate(${st.rotation || -12}deg)`,
              }}
              className={`absolute z-20 border-4 border-dashed rounded-lg flex items-center justify-center font-black tracking-widest uppercase cursor-grab active:cursor-grabbing select-none ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => startDraggingElement(e, st.id, 'stamp', st.x, st.y)}
                  className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 cursor-grab active:cursor-grabbing pointer-events-auto select-none whitespace-nowrap"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>DRAG TO MOVE</span>
                </div>
              )}
              <span style={{ fontSize: `${cRect.height * 0.45}px` }}>
                {st.customText || st.stampType}
              </span>
            </div>
          );
        })}

      {/* 12. Active Drag Box Preview (for shapes / whiteout / highlight) */}
      {dragStart && dragCurrent && (
        <div
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x)}px`,
            top: `${Math.min(dragStart.y, dragCurrent.y)}px`,
            width: `${Math.abs(dragCurrent.x - dragStart.x)}px`,
            height: `${Math.abs(dragCurrent.y - dragStart.y)}px`,
          }}
          className={`absolute pointer-events-none z-30 ${
            activeTool === 'whiteout'
              ? 'bg-white/80 border-2 border-slate-500'
              : activeTool === 'highlight'
              ? 'bg-amber-300/40 border border-amber-400'
              : 'border-2 border-blue-500 bg-blue-500/10'
          }`}
        />
      )}

      {/* 13. In-flight Freehand Drawing Canvas */}
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 pointer-events-none z-25"
      />

      {/* 14. Inline Text Editor for Existing Text Replacement */}
      {editingTextItem && (
        <InlineTextEditor
          initialText={editingTextItem.item.str}
          x={editingTextItem.canvasX}
          y={editingTextItem.canvasY}
          width={editingTextItem.width}
          height={editingTextItem.height}
          fontSize={editingTextItem.item.fontSize * scale}
          onCommit={(newText) => {
            onAddTextReplacement({
              id: `rep-${page.pageIndex}-${editingTextItem.item.id}`,
              pageIndex: page.pageIndex,
              originalText: editingTextItem.item.str,
              originalBounds: editingTextItem.item.bounds,
              newText,
              fontFamily: 'Helvetica',
              fontSize: editingTextItem.item.fontSize,
              color: '#000000',
              backgroundColor: 'transparent',
              whitewashOriginal: true,
              x: editingTextItem.item.bounds.x,
              y: editingTextItem.item.bounds.y,
            });
            setEditingTextItem(null);
          }}
          onCancel={() => setEditingTextItem(null)}
        />
      )}

      {/* 15. Inline Text Editor for Add Text Tool */}
      {addingTextPos && (
        <InlineTextEditor
          initialText="New Text"
          x={addingTextPos.x}
          y={addingTextPos.y}
          width={120}
          height={24}
          fontSize={14 * scale}
          onCommit={(text) => {
            const pdfPoint = canvasToPdf(
              { x: addingTextPos.x, y: addingTextPos.y },
              page.height,
              scale
            );
            onAddText({
              id: `text-${Date.now()}`,
              pageIndex: page.pageIndex,
              x: pdfPoint.x,
              y: pdfPoint.y,
              width: 140,
              height: 24,
              text,
              fontFamily: 'Helvetica',
              fontSize: 14,
              color: '#000000',
              alignment: 'left',
              opacity: 1.0,
            });
            setAddingTextPos(null);
          }}
          onCancel={() => setAddingTextPos(null)}
        />
      )}
    </div>
  );
};
