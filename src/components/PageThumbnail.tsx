import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { RotateCw, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { PageInfo } from '../types/pdf';

interface PageThumbnailProps {
  page: PageInfo;
  index: number;
  totalCount: number;
  isSelected: boolean;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  onSelect: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  index,
  totalCount,
  isSelected,
  pdfDoc,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      if (!canvasRef.current || !pdfDoc) return;
      if (page.originalPageIndex < 0) {
        // Blank page - draw empty white card
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 100;
          canvas.height = 140;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 100, 140);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(0, 0, 100, 140);
        }
        return;
      }

      try {
        const pdfPage = await pdfDoc.getPage(page.originalPageIndex + 1);
        if (isCancelled || !canvasRef.current) return;

        const targetRotation = page.rotation !== undefined ? page.rotation : pdfPage.rotate;
        const viewport = pdfPage.getViewport({
          scale: 0.2,
          rotation: targetRotation,
        });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pdfPage.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;
      } catch (err) {
        // Render cancelled or page unmounted
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, page.originalPageIndex, page.rotation]);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
        isSelected
          ? 'bg-blue-600/10 border-blue-500 shadow-md ring-1 ring-blue-500'
          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
      }`}
    >
      {/* Page number badge */}
      <div className="w-full flex items-center justify-between mb-1.5 px-1 text-[11px] font-medium text-slate-400">
        <span>Page {index + 1}</span>
        {page.rotation !== 0 && (
          <span className="text-[10px] text-blue-400 font-mono">{page.rotation}°</span>
        )}
      </div>

      {/* Thumbnail canvas */}
      <div className="w-28 h-36 bg-white rounded-md shadow-sm overflow-hidden flex items-center justify-center border border-slate-700/50">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      </div>

      {/* Hover Action Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          onClick={onRotate}
          className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDuplicate}
          className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
          title="Duplicate Page"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {onMoveUp && index > 0 && (
          <button
            onClick={onMoveUp}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
            title="Move Page Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}

        {onMoveDown && index < totalCount - 1 && (
          <button
            onClick={onMoveDown}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
            title="Move Page Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onDelete}
          className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300 transition"
          title="Delete Page"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
