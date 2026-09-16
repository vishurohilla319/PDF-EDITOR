import React from 'react';
import { X, Stamp as StampIcon } from 'lucide-react';
import { StampType } from '../types/editor';

interface StampToolProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStamp: (stampType: StampType, color: string) => void;
}

export const StampTool: React.FC<StampToolProps> = ({
  isOpen,
  onClose,
  onSelectStamp,
}) => {
  if (!isOpen) return null;

  const stamps: Array<{ type: StampType; color: string; bg: string }> = [
    { type: 'APPROVED', color: '#16a34a', bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' },
    { type: 'PAID', color: '#2563eb', bg: 'bg-blue-500/10 border-blue-500/40 text-blue-400' },
    { type: 'REJECTED', color: '#dc2626', bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400' },
    { type: 'CONFIDENTIAL', color: '#dc2626', bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400' },
    { type: 'DRAFT', color: '#d97706', bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400' },
    { type: 'COPY', color: '#4b5563', bg: 'bg-slate-500/10 border-slate-500/40 text-slate-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <StampIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Choose Stamp</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stamps.map((s) => (
            <button
              key={s.type}
              onClick={() => {
                onSelectStamp(s.type, s.color);
                onClose();
              }}
              className={`p-3 rounded-xl border font-bold text-xs tracking-widest text-center uppercase transition hover:scale-105 ${s.bg}`}
            >
              {s.type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
