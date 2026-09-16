import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface InlineTextEditorProps {
  initialText: string;
  x: number; // in Canvas coordinates
  y: number; // in Canvas coordinates
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  onCommit: (newText: string) => void;
  onCancel: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  initialText,
  x,
  y,
  width,
  height,
  fontSize,
  fontFamily = 'Helvetica, Arial, sans-serif',
  color = '#000000',
  backgroundColor = '#ffffff',
  onCommit,
  onCancel,
}) => {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        minWidth: `${Math.max(width + 20, 120)}px`,
        backgroundColor: backgroundColor,
        zIndex: 40,
      }}
      className="flex items-center gap-1 p-1 rounded shadow-xl border-2 border-blue-500"
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${Math.max(fontSize, 12)}px`,
          fontFamily: fontFamily,
          color: color,
        }}
        className="flex-1 bg-transparent px-1.5 py-0.5 outline-none border-none"
      />
      <button
        onClick={() => onCommit(text)}
        className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition"
        title="Apply (Enter)"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded hover:bg-slate-200 text-slate-500 transition"
        title="Cancel (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
