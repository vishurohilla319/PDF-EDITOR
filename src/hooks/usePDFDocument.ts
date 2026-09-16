import { useState, useCallback, useRef } from 'react';
import { PageInfo } from '../types/pdf';
import {
  EditorDocumentState,
  HistorySnapshot,
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
import { useEditorHistory } from './useEditorHistory';

const initialDocState: EditorDocumentState = {
  file: null,
  pdfBytes: null,
  fileName: '',
  numPages: 0,
  pages: [],
  pageRotations: {},
  pageOrder: [],
  deletedPages: [],
  textReplacements: [],
  addedTexts: [],
  images: [],
  signatures: [],
  drawings: [],
  shapes: [],
  whiteouts: [],
  stamps: [],
  annotations: [],
};

export function usePDFDocument() {
  const [docState, setDocState] = useState<EditorDocumentState>(initialDocState);
  const nextNegativeId = useRef(-1);

  const history = useEditorHistory();

  const takeSnapshot = useCallback(
    (currentState: EditorDocumentState): HistorySnapshot => ({
      pageOrder: [...currentState.pageOrder],
      pageRotations: { ...currentState.pageRotations },
      pages: [...currentState.pages],
      textReplacements: [...currentState.textReplacements],
      addedTexts: [...currentState.addedTexts],
      images: [...currentState.images],
      signatures: [...currentState.signatures],
      drawings: [...currentState.drawings],
      shapes: [...currentState.shapes],
      whiteouts: [...currentState.whiteouts],
      stamps: [...currentState.stamps],
      annotations: [...currentState.annotations],
    }),
    []
  );

  const applySnapshot = useCallback((snapshot: HistorySnapshot) => {
    setDocState((prev) => ({
      ...prev,
      pageOrder: snapshot.pageOrder,
      pageRotations: snapshot.pageRotations,
      pages: snapshot.pages,
      textReplacements: snapshot.textReplacements,
      addedTexts: snapshot.addedTexts,
      images: snapshot.images,
      signatures: snapshot.signatures,
      drawings: snapshot.drawings,
      shapes: snapshot.shapes,
      whiteouts: snapshot.whiteouts,
      stamps: snapshot.stamps,
      annotations: snapshot.annotations,
    }));
  }, []);

  const initDocument = useCallback(
    (pdfBytes: Uint8Array, fileName: string, pages: PageInfo[], file: File | null = null) => {
      const pageOrder = pages.map((p) => p.pageIndex);
      const rotations: Record<number, number> = {};
      pages.forEach((p) => {
        rotations[p.pageIndex] = p.rotation;
      });

      const newState: EditorDocumentState = {
        file,
        pdfBytes,
        fileName,
        numPages: pages.length,
        pages,
        pageRotations: rotations,
        pageOrder,
        deletedPages: [],
        textReplacements: [],
        addedTexts: [],
        images: [],
        signatures: [],
        drawings: [],
        shapes: [],
        whiteouts: [],
        stamps: [],
        annotations: [],
      };

      setDocState(newState);
      history.setInitial(takeSnapshot(newState));
    },
    [history, takeSnapshot]
  );

  // Helper to mutate document and record in undo history
  const updateStateWithHistory = useCallback(
    (updater: (prev: EditorDocumentState) => EditorDocumentState) => {
      setDocState((prev) => {
        const next = updater(prev);
        history.pushSnapshot(takeSnapshot(next));
        return next;
      });
    },
    [history, takeSnapshot]
  );

  // Page operations
  const rotatePage = useCallback(
    (pageIndex: number, delta: number = 90) => {
      updateStateWithHistory((prev) => {
        const currentRot = prev.pageRotations[pageIndex] || 0;
        const newRot = ((currentRot + delta) % 360 + 360) % 360;
        return {
          ...prev,
          pageRotations: {
            ...prev.pageRotations,
            [pageIndex]: newRot,
          },
        };
      });
    },
    [updateStateWithHistory]
  );

  const deletePage = useCallback(
    (pageIndex: number) => {
      updateStateWithHistory((prev) => {
        if (prev.pageOrder.length <= 1) {
          alert('Cannot delete the only remaining page');
          return prev;
        }
        return {
          ...prev,
          pageOrder: prev.pageOrder.filter((p) => p !== pageIndex),
        };
      });
    },
    [updateStateWithHistory]
  );

  const duplicatePage = useCallback(
    (pageIndex: number) => {
      updateStateWithHistory((prev) => {
        const orderIdx = prev.pageOrder.indexOf(pageIndex);
        if (orderIdx === -1) return prev;

        const newOrder = [...prev.pageOrder];
        newOrder.splice(orderIdx + 1, 0, pageIndex);
        return {
          ...prev,
          pageOrder: newOrder,
        };
      });
    },
    [updateStateWithHistory]
  );

  const addBlankPage = useCallback(() => {
    updateStateWithHistory((prev) => {
      const blankId = nextNegativeId.current--;
      const newPageInfo: PageInfo = {
        pageIndex: blankId,
        pageNumber: prev.pageOrder.length + 1,
        width: 595.28,
        height: 841.89,
        rotation: 0,
        originalPageIndex: blankId,
        isCustomBlank: true,
      };

      return {
        ...prev,
        pages: [...prev.pages, newPageInfo],
        pageOrder: [...prev.pageOrder, blankId],
        pageRotations: { ...prev.pageRotations, [blankId]: 0 },
      };
    });
  }, [updateStateWithHistory]);

  const reorderPages = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateStateWithHistory((prev) => {
        const newOrder = [...prev.pageOrder];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        return {
          ...prev,
          pageOrder: newOrder,
        };
      });
    },
    [updateStateWithHistory]
  );

  // Element mutations
  const addTextReplacement = useCallback(
    (replacement: TextReplacement) => {
      updateStateWithHistory((prev) => {
        const filtered = prev.textReplacements.filter((r) => r.id !== replacement.id);
        return {
          ...prev,
          textReplacements: [...filtered, replacement],
        };
      });
    },
    [updateStateWithHistory]
  );

  const updateTextReplacement = useCallback(
    (id: string, updates: Partial<TextReplacement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        textReplacements: prev.textReplacements.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addText = useCallback(
    (textElem: AddedTextElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        addedTexts: [...prev.addedTexts, textElem],
      }));
    },
    [updateStateWithHistory]
  );

  const updateText = useCallback(
    (id: string, updates: Partial<AddedTextElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        addedTexts: prev.addedTexts.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addImage = useCallback(
    (imgElem: ImageElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        images: [...prev.images, imgElem],
      }));
    },
    [updateStateWithHistory]
  );

  const updateImage = useCallback(
    (id: string, updates: Partial<ImageElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === id ? { ...img, ...updates } : img
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addSignature = useCallback(
    (sig: SignatureElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        signatures: [...prev.signatures, sig],
      }));
    },
    [updateStateWithHistory]
  );

  const updateSignature = useCallback(
    (id: string, updates: Partial<SignatureElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        signatures: prev.signatures.map((sig) =>
          sig.id === id ? { ...sig, ...updates } : sig
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addDrawing = useCallback(
    (drawing: DrawingElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        drawings: [...prev.drawings, drawing],
      }));
    },
    [updateStateWithHistory]
  );

  const addShape = useCallback(
    (shape: ShapeElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        shapes: [...prev.shapes, shape],
      }));
    },
    [updateStateWithHistory]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<ShapeElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },
    [updateStateWithHistory]
  );

  const addWhiteout = useCallback(
    (whiteout: WhiteoutElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        whiteouts: [...prev.whiteouts, whiteout],
      }));
    },
    [updateStateWithHistory]
  );

  const updateWhiteout = useCallback(
    (id: string, updates: Partial<WhiteoutElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        whiteouts: prev.whiteouts.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addStamp = useCallback(
    (stamp: StampElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        stamps: [...prev.stamps, stamp],
      }));
    },
    [updateStateWithHistory]
  );

  const updateStamp = useCallback(
    (id: string, updates: Partial<StampElement>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        stamps: prev.stamps.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    [updateStateWithHistory]
  );

  const addAnnotation = useCallback(
    (ann: AnnotationElement) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        annotations: [...prev.annotations, ann],
      }));
    },
    [updateStateWithHistory]
  );

  const deleteElement = useCallback(
    (id: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        textReplacements: prev.textReplacements.filter((r) => r.id !== id),
        addedTexts: prev.addedTexts.filter((t) => t.id !== id),
        images: prev.images.filter((img) => img.id !== id),
        signatures: prev.signatures.filter((s) => s.id !== id),
        drawings: prev.drawings.filter((d) => d.id !== id),
        shapes: prev.shapes.filter((s) => s.id !== id),
        whiteouts: prev.whiteouts.filter((w) => w.id !== id),
        stamps: prev.stamps.filter((s) => s.id !== id),
        annotations: prev.annotations.filter((a) => a.id !== id),
      }));
    },
    [updateStateWithHistory]
  );

  const handleUndo = useCallback(() => {
    history.undo(applySnapshot);
  }, [history, applySnapshot]);

  const handleRedo = useCallback(() => {
    history.redo(applySnapshot);
  }, [history, applySnapshot]);

  return {
    docState,
    initDocument,
    // Page ops
    rotatePage,
    deletePage,
    duplicatePage,
    addBlankPage,
    reorderPages,
    // Element ops
    addTextReplacement,
    updateTextReplacement,
    addText,
    updateText,
    addImage,
    updateImage,
    addSignature,
    updateSignature,
    addDrawing,
    addShape,
    updateShape,
    addWhiteout,
    updateWhiteout,
    addStamp,
    updateStamp,
    addAnnotation,
    deleteElement,
    // Undo / Redo
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: handleUndo,
    redo: handleRedo,
  };
}
