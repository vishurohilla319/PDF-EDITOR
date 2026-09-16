import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { EditorTool, ShapeType, StampType } from '../types/editor';
import { PageInfo } from '../types/pdf';
import { usePDFDocument } from '../hooks/usePDFDocument';
import { useZoom } from '../hooks/useZoom';
import { useSelection } from '../hooks/useSelection';
import { Toolbar } from './Toolbar';
import { PageSidebar } from './PageSidebar';
import { PDFViewer } from './PDFViewer';
import { PropertyPanel } from './PropertyPanel';
import { SignatureTool } from './SignatureTool';
import { ImageTool } from './ImageTool';
import { ShapeTool } from './ShapeTool';
import { StampTool } from './StampTool';
import { AnnotationTool } from './AnnotationTool';
import { DownloadDialog } from './DownloadDialog';

interface PDFEditorProps {
  pdfBytes: Uint8Array;
  fileName: string;
  initialPages: PageInfo[];
  originalFile: File | null;
  onOpenNew: () => void;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({
  pdfBytes,
  fileName,
  initialPages,
  originalFile,
  onOpenNew,
}) => {
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Modals state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isShapeModalOpen, setIsShapeModalOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [annotationModal, setAnnotationModal] = useState<{
    isOpen: boolean;
    type: 'highlight' | 'comment';
  }>({ isOpen: false, type: 'highlight' });
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  // Core Hooks
  const doc = usePDFDocument();
  const zoom = useZoom(1.0);
  const selection = useSelection();

  // Initialize document state and load PDF.js proxy
  useEffect(() => {
    doc.initDocument(pdfBytes, fileName, initialPages, originalFile);

    const loadProxy = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes.slice(),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });
        const proxy = await loadingTask.promise;
        setPdfDocProxy(proxy);
      } catch (err) {
        console.error('Failed to load PDF.js document proxy:', err);
      }
    };

    loadProxy();
  }, [pdfBytes, fileName, initialPages]);

  // Handle Tool Selection
  const handleSelectTool = (tool: EditorTool) => {
    setActiveTool(tool);

    if (tool === 'signature') {
      setIsSignatureModalOpen(true);
    } else if (tool === 'image') {
      setIsImageModalOpen(true);
    } else if (tool === 'shape') {
      setIsShapeModalOpen(true);
    } else if (tool === 'stamp') {
      setIsStampModalOpen(true);
    } else if (tool === 'comment') {
      setAnnotationModal({ isOpen: true, type: 'comment' });
    }
  };

  // Handle Element Position Updates (Drag moving & nudging)
  const handleUpdateElementPosition = useCallback(
    (id: string, type: string, x: number, y: number) => {
      if (type === 'text') doc.updateText(id, { x, y });
      else if (type === 'replacement') {
        const rep = doc.docState.textReplacements.find((r) => r.id === id);
        if (rep) {
          doc.updateTextReplacement(id, {
            originalBounds: { ...rep.originalBounds, x, y },
          });
        }
      } else if (type === 'image') doc.updateImage(id, { x, y });
      else if (type === 'signature') doc.updateSignature(id, { x, y });
      else if (type === 'shape') doc.updateShape(id, { x, y });
      else if (type === 'whiteout') doc.updateWhiteout(id, { x, y });
      else if (type === 'stamp') doc.updateStamp(id, { x, y });
    },
    [doc]
  );

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Delete, Esc, Ctrl+S, Arrow Keys to move)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing inside an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        doc.undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        doc.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsDownloadDialogOpen(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.selectedItem) {
          e.preventDefault();
          doc.deleteElement(selection.selectedItem.id);
          selection.clearSelection();
        }
      } else if (e.key === 'Escape') {
        selection.clearSelection();
        setActiveTool('select');
      } else if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        selection.selectedItem
      ) {
        // Precise arrow keys nudge/move function
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
        const item = selection.selectedItem;

        if (item.type === 'text') {
          const t = doc.docState.addedTexts.find((el) => el.id === item.id);
          if (t) handleUpdateElementPosition(item.id, 'text', t.x + dx, t.y + dy);
        } else if (item.type === 'replacement') {
          const r = doc.docState.textReplacements.find((el) => el.id === item.id);
          if (r) handleUpdateElementPosition(item.id, 'replacement', r.originalBounds.x + dx, r.originalBounds.y + dy);
        } else if (item.type === 'image') {
          const img = doc.docState.images.find((el) => el.id === item.id);
          if (img) handleUpdateElementPosition(item.id, 'image', img.x + dx, img.y + dy);
        } else if (item.type === 'signature') {
          const s = doc.docState.signatures.find((el) => el.id === item.id);
          if (s) handleUpdateElementPosition(item.id, 'signature', s.x + dx, s.y + dy);
        } else if (item.type === 'shape') {
          const sh = doc.docState.shapes.find((el) => el.id === item.id);
          if (sh) handleUpdateElementPosition(item.id, 'shape', sh.x + dx, sh.y + dy);
        } else if (item.type === 'whiteout') {
          const w = doc.docState.whiteouts.find((el) => el.id === item.id);
          if (w) handleUpdateElementPosition(item.id, 'whiteout', w.x + dx, w.y + dy);
        } else if (item.type === 'stamp') {
          const st = doc.docState.stamps.find((el) => el.id === item.id);
          if (st) handleUpdateElementPosition(item.id, 'stamp', st.x + dx, st.y + dy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, selection, handleUpdateElementPosition]);

  // Apply Signature
  const handleSaveSignature = (dataUrl: string) => {
    const targetPageIndex = doc.docState.pageOrder[currentPageIndex] ?? 0;
    doc.addSignature({
      id: `sig-${Date.now()}`,
      pageIndex: targetPageIndex,
      x: 120,
      y: 180,
      width: 140,
      height: 60,
      dataUrl,
      opacity: 1.0,
      rotation: 0,
    });
    setActiveTool('select');
  };

  // Apply Image
  const handleSaveImage = (dataUrl: string, mimeType: 'image/png' | 'image/jpeg') => {
    const targetPageIndex = doc.docState.pageOrder[currentPageIndex] ?? 0;
    doc.addImage({
      id: `img-${Date.now()}`,
      pageIndex: targetPageIndex,
      x: 100,
      y: 350,
      width: 180,
      height: 120,
      dataUrl,
      mimeType,
      opacity: 1.0,
      rotation: 0,
    });
    setActiveTool('select');
  };

  // Apply Shape
  const handleSelectShape = (shapeType: ShapeType) => {
    const targetPageIndex = doc.docState.pageOrder[currentPageIndex] ?? 0;
    doc.addShape({
      id: `shape-${Date.now()}`,
      pageIndex: targetPageIndex,
      shapeType,
      x: 150,
      y: 400,
      width: 140,
      height: 80,
      strokeColor: '#2563eb',
      fillColor: 'transparent',
      strokeWidth: 2,
      opacity: 1.0,
    });
    setActiveTool('select');
  };

  // Apply Stamp
  const handleSelectStamp = (stampType: StampType, color: string) => {
    const targetPageIndex = doc.docState.pageOrder[currentPageIndex] ?? 0;
    doc.addStamp({
      id: `stamp-${Date.now()}`,
      pageIndex: targetPageIndex,
      stampType,
      x: 200,
      y: 450,
      width: 140,
      height: 45,
      color,
      rotation: -12,
    });
    setActiveTool('select');
  };

  // Apply Comment
  const handleAddComment = (commentText: string, author: string) => {
    const targetPageIndex = doc.docState.pageOrder[currentPageIndex] ?? 0;
    doc.addAnnotation({
      id: `comment-${Date.now()}`,
      pageIndex: targetPageIndex,
      type: 'comment',
      rects: [],
      x: 100,
      y: 500,
      commentText,
      author,
      color: '#f59e0b',
      opacity: 1.0,
    });
    setActiveTool('select');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      {/* 1. Top Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        canUndo={doc.canUndo}
        canRedo={doc.canRedo}
        onUndo={doc.undo}
        onRedo={doc.redo}
        scale={zoom.scale}
        onZoomIn={zoom.zoomIn}
        onZoomOut={zoom.zoomOut}
        onSetZoom={zoom.setScale}
        onFitWidth={() => zoom.fitWidth(window.innerWidth - 300, 600)}
        onFitPage={() => zoom.fitPage(window.innerHeight - 100, 842)}
        onRotateCurrentPage={() => {
          const pageId = doc.docState.pageOrder[currentPageIndex];
          if (pageId !== undefined) doc.rotatePage(pageId, 90);
        }}
        onFlip180CurrentPage={() => {
          const pageId = doc.docState.pageOrder[currentPageIndex];
          if (pageId !== undefined) doc.rotatePage(pageId, 180);
        }}
        onOpenNew={onOpenNew}
        onDownload={() => setIsDownloadDialogOpen(true)}
        fileName={doc.docState.fileName}
      />

      {/* 2. Main Middle Workspace: Sidebar + PDF Viewport + Property Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Thumbnail Sidebar */}
        <PageSidebar
          pages={doc.docState.pages}
          pageOrder={doc.docState.pageOrder}
          pageRotations={doc.docState.pageRotations}
          currentPageIndex={currentPageIndex}
          pdfDoc={pdfDocProxy}
          onSelectPage={(idx) => setCurrentPageIndex(idx)}
          onRotatePage={(pageId) => doc.rotatePage(pageId, 90)}
          onDuplicatePage={(pageId) => doc.duplicatePage(pageId)}
          onDeletePage={(pageId) => doc.deletePage(pageId)}
          onAddBlankPage={() => doc.addBlankPage()}
          onReorderPages={(from, to) => doc.reorderPages(from, to)}
        />

        {/* Center PDF Viewer */}
        <PDFViewer
          pages={doc.docState.pages}
          pageOrder={doc.docState.pageOrder}
          pageRotations={doc.docState.pageRotations}
          currentPageIndex={currentPageIndex}
          pdfDoc={pdfDocProxy}
          scale={zoom.scale}
          activeTool={activeTool}
          textReplacements={doc.docState.textReplacements}
          addedTexts={doc.docState.addedTexts}
          images={doc.docState.images}
          signatures={doc.docState.signatures}
          drawings={doc.docState.drawings}
          shapes={doc.docState.shapes}
          whiteouts={doc.docState.whiteouts}
          stamps={doc.docState.stamps}
          annotations={doc.docState.annotations}
          selectedItem={selection.selectedItem}
          onSelectElement={(id, type, pageIdx) => {
            selection.select(id, type, pageIdx);
          }}
          onClearSelection={selection.clearSelection}
          onAddTextReplacement={doc.addTextReplacement}
          onAddText={doc.addText}
          onAddDrawing={doc.addDrawing}
          onAddShape={doc.addShape}
          onAddWhiteout={doc.addWhiteout}
          onAddAnnotation={doc.addAnnotation}
          onUpdateElementPosition={handleUpdateElementPosition}
          onSelectPage={(idx) => setCurrentPageIndex(idx)}
        />

        {/* Right Property Panel */}
        <PropertyPanel
          selectedItem={selection.selectedItem}
          docState={doc.docState}
          onUpdateTextReplacement={doc.updateTextReplacement}
          onUpdateText={doc.updateText}
          onUpdateShape={doc.updateShape}
          onUpdateImage={doc.updateImage}
          onUpdateSignature={doc.updateSignature}
          onUpdateWhiteout={doc.updateWhiteout}
          onUpdateStamp={doc.updateStamp}
          onDeleteElement={(id) => {
            doc.deleteElement(id);
            selection.clearSelection();
          }}
        />
      </div>

      {/* 3. Modal Dialogs */}
      <SignatureTool
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setActiveTool('select');
        }}
        onSaveSignature={handleSaveSignature}
      />

      <ImageTool
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setActiveTool('select');
        }}
        onImageSelected={handleSaveImage}
      />

      <ShapeTool
        isOpen={isShapeModalOpen}
        onClose={() => {
          setIsShapeModalOpen(false);
          setActiveTool('select');
        }}
        onSelectShape={handleSelectShape}
      />

      <StampTool
        isOpen={isStampModalOpen}
        onClose={() => {
          setIsStampModalOpen(false);
          setActiveTool('select');
        }}
        onSelectStamp={handleSelectStamp}
      />

      <AnnotationTool
        isOpen={annotationModal.isOpen}
        type={annotationModal.type}
        onClose={() => {
          setAnnotationModal({ isOpen: false, type: 'highlight' });
          setActiveTool('select');
        }}
        onApplyHighlightColor={() => {
          setAnnotationModal({ isOpen: false, type: 'highlight' });
        }}
        onAddComment={handleAddComment}
      />

      <DownloadDialog
        isOpen={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
        originalPdfBytes={doc.docState.pdfBytes || pdfBytes}
        documentState={doc.docState}
      />
    </div>
  );
};
