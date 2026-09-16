import React from 'react';
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Image as ImageIcon,
  FileSignature,
  Stamp,
  MessageSquare,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  FolderOpen,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { EditorTool } from '../types/editor';

interface ToolbarProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetZoom: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onRotateCurrentPage?: () => void;
  onFlip180CurrentPage?: () => void;
  onOpenNew: () => void;
  onDownload: () => void;
  fileName: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  scale,
  onZoomIn,
  onZoomOut,
  onSetZoom,
  onFitWidth,
  onFitPage,
  onRotateCurrentPage,
  onFlip180CurrentPage,
  onOpenNew,
  onDownload,
  fileName,
}) => {
  const tools: Array<{ id: EditorTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'editText', label: 'Edit Text', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { id: 'addText', label: 'Add Text', icon: <Type className="w-4 h-4" /> },
    { id: 'highlight', label: 'Highlight', icon: <Highlighter className="w-4 h-4" /> },
    { id: 'draw', label: 'Draw', icon: <PenTool className="w-4 h-4" /> },
    { id: 'shape', label: 'Shape', icon: <Square className="w-4 h-4" /> },
    { id: 'whiteout', label: 'Whiteout', icon: <Eraser className="w-4 h-4" /> },
    { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'signature', label: 'Signature', icon: <FileSignature className="w-4 h-4" /> },
    { id: 'stamp', label: 'Stamp', icon: <Stamp className="w-4 h-4" /> },
    { id: 'comment', label: 'Comment', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none flex flex-col z-30 shadow-md">
      {/* Top Header Row: Branding, File Info, Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNew}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            title="Open another PDF"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Open</span>
          </button>

          <span className="h-4 w-px bg-slate-800" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition ${
                canUndo
                  ? 'hover:bg-slate-800 text-slate-200'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition ${
                canRedo
                  ? 'hover:bg-slate-800 text-slate-200'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <span className="h-4 w-px bg-slate-800" />

          {/* File Name display */}
          <div className="text-xs text-slate-400 truncate max-w-xs font-mono">
            {fileName || 'document.pdf'}
          </div>
        </div>

        {/* Right side: Zoom & Download */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={onZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <select
              value={Math.round(scale * 100)}
              onChange={(e) => onSetZoom(Number(e.target.value) / 100)}
              className="bg-transparent text-xs text-slate-200 px-1 py-1 focus:outline-none cursor-pointer"
            >
              <option value="50" className="bg-slate-900">50%</option>
              <option value="75" className="bg-slate-900">75%</option>
              <option value="100" className="bg-slate-900">100%</option>
              <option value="125" className="bg-slate-900">125%</option>
              <option value="150" className="bg-slate-900">150%</option>
              <option value="200" className="bg-slate-900">200%</option>
            </select>

            <button
              onClick={onZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit Controls */}
          <button
            onClick={onFitWidth}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition"
            title="Fit Width"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onFitPage}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition"
            title="Fit Page"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          {onRotateCurrentPage && (
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
              <button
                onClick={onRotateCurrentPage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                title="Rotate Page 90° Clockwise"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Rotate 90°</span>
              </button>
              {onFlip180CurrentPage && (
                <button
                  onClick={onFlip180CurrentPage}
                  className="px-2 py-1.5 rounded-md hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition"
                  title="Flip Page 180° (Turn Right-Side Up)"
                >
                  Flip 180°
                </button>
              )}
            </div>
          )}

          <span className="h-4 w-px bg-slate-800" />

          {/* Export / Download Button */}
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 hover:shadow-blue-500/40 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Bottom Tool Selection Row */}
      <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto bg-slate-900/90 scrollbar-none">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
