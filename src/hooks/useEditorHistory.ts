import { useState, useCallback, useRef } from 'react';
import { HistorySnapshot } from '../types/editor';

const MAX_HISTORY = 40;

export function useEditorHistory(initialSnapshot?: HistorySnapshot) {
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);
  const currentSnapshotRef = useRef<HistorySnapshot | null>(initialSnapshot || null);

  const setInitial = useCallback((snapshot: HistorySnapshot) => {
    currentSnapshotRef.current = JSON.parse(JSON.stringify(snapshot));
    setPast([]);
    setFuture([]);
  }, []);

  const pushSnapshot = useCallback((newSnapshot: HistorySnapshot) => {
    if (currentSnapshotRef.current) {
      setPast((prev) => [...prev.slice(-MAX_HISTORY), currentSnapshotRef.current!]);
    }
    currentSnapshotRef.current = JSON.parse(JSON.stringify(newSnapshot));
    setFuture([]); // Clear future on new action
  }, []);

  const undo = useCallback((applySnapshot: (snapshot: HistorySnapshot) => void) => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const newPast = prev.slice(0, prev.length - 1);

      if (currentSnapshotRef.current) {
        setFuture((f) => [currentSnapshotRef.current!, ...f]);
      }

      currentSnapshotRef.current = previous;
      applySnapshot(previous);
      return newPast;
    });
  }, []);

  const redo = useCallback((applySnapshot: (snapshot: HistorySnapshot) => void) => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      const newFuture = prev.slice(1);

      if (currentSnapshotRef.current) {
        setPast((p) => [...p, currentSnapshotRef.current!]);
      }

      currentSnapshotRef.current = next;
      applySnapshot(next);
      return newFuture;
    });
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    pushSnapshot,
    setInitial,
  };
}
