import React from 'react';
import { Square, Circle, Minus, MoveRight, X } from 'lucide-react';
import { ShapeType } from '../types/editor';

interface ShapeToolProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (shapeType: ShapeType) => void;
}

export const ShapeTool: React.FC<ShapeToolProps> = ({
  isOpen,
  onClose,
  onSelectShape,
}) => {
  if (!isOpen) return null;

  const shapes: Array<{ type: ShapeType; label: string; icon: React.ReactNode }> = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-5 h-5" /> },
    { type: 'circle', label: 'Circle / Ellipse', icon: <Circle className="w-5 h-5" /> },
    { type: 'line', label: 'Line', icon: <Minus className="w-5 h-5" /> },
    { type: 'arrow', label: 'Arrow', icon: <MoveRight className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-semibold text-white">Choose Shape</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {shapes.map((s) => (
            <button
              key={s.type}
              onClick={() => {
                onSelectShape(s.type);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-blue-600/10 hover:border-blue-500/60 text-slate-300 hover:text-white transition group"
            >
              <div className="text-slate-400 group-hover:text-blue-400 group-hover:scale-110 transition">
                {s.icon}
              </div>
              <span className="text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
