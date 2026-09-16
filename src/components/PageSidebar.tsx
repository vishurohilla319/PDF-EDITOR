import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Plus, Layers } from 'lucide-react';
import { PageInfo } from '../types/pdf';
import { PageThumbnail } from './PageThumbnail';

interface PageSidebarProps {
  pages: PageInfo[];
  pageOrder: number[];
  pageRotations: Record<number, number>;
  currentPageIndex: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  onSelectPage: (pageIndex: number) => void;
  onRotatePage: (pageIndex: number) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onAddBlankPage: () => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  pages,
  pageOrder,
  pageRotations,
  currentPageIndex,
  pdfDoc,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onAddBlankPage,
  onReorderPages,
}) => {
  return (
    <aside className="w-52 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none z-20">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Pages ({pageOrder.length})</span>
        </div>

        <button
          onClick={onAddBlankPage}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs transition"
          title="Add Blank Page"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Blank</span>
        </button>
      </div>

      {/* Thumbnails Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pageOrder.map((pageId, orderIndex) => {
          const pageInfo = pages.find((p) => p.pageIndex === pageId);
          if (!pageInfo) return null;

          const rotatedInfo: PageInfo = {
            ...pageInfo,
            rotation: pageRotations[pageId] !== undefined ? pageRotations[pageId] : pageInfo.rotation,
          };

          return (
            <PageThumbnail
              key={`thumb-${pageId}-${orderIndex}`}
              page={rotatedInfo}
              index={orderIndex}
              totalCount={pageOrder.length}
              isSelected={orderIndex === currentPageIndex}
              pdfDoc={pdfDoc}
              onSelect={() => onSelectPage(orderIndex)}
              onRotate={() => onRotatePage(pageId)}
              onDuplicate={() => onDuplicatePage(pageId)}
              onDelete={() => onDeletePage(pageId)}
              onMoveUp={() => onReorderPages(orderIndex, orderIndex - 1)}
              onMoveDown={() => onReorderPages(orderIndex, orderIndex + 1)}
            />
          );
        })}
      </div>
    </aside>
  );
};
