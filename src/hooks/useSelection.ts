import { useState, useCallback } from 'react';

export type SelectedElementType =
  | 'text'
  | 'replacement'
  | 'image'
  | 'signature'
  | 'shape'
  | 'whiteout'
  | 'stamp'
  | 'annotation';

export interface SelectedItem {
  id: string;
  type: SelectedElementType;
  pageIndex: number;
}

export function useSelection() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const select = useCallback((id: string, type: SelectedElementType, pageIndex: number) => {
    setSelectedItem({ id, type, pageIndex });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedItem?.id === id;
    },
    [selectedItem]
  );

  return {
    selectedItem,
    select,
    clearSelection,
    isSelected,
  };
}
