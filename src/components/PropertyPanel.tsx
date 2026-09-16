import React from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  RotateCw,
  Palette,
} from 'lucide-react';
import { SelectedItem } from '../hooks/useSelection';
import {
  EditorDocumentState,
  TextReplacement,
  AddedTextElement,
  ShapeElement,
  ImageElement,
  SignatureElement,
  WhiteoutElement,
  StampElement,
} from '../types/editor';
import { AVAILABLE_FONTS } from '../lib/pdf/fontManager';
import { COLOR_PALETTE } from '../lib/pdf/annotations';

interface PropertyPanelProps {
  selectedItem: SelectedItem | null;
  docState: EditorDocumentState;
  onUpdateTextReplacement: (id: string, updates: Partial<TextReplacement>) => void;
  onUpdateText: (id: string, updates: Partial<AddedTextElement>) => void;
  onUpdateShape: (id: string, updates: Partial<ShapeElement>) => void;
  onUpdateImage: (id: string, updates: Partial<ImageElement>) => void;
  onUpdateSignature: (id: string, updates: Partial<SignatureElement>) => void;
  onUpdateWhiteout: (id: string, updates: Partial<WhiteoutElement>) => void;
  onUpdateStamp: (id: string, updates: Partial<StampElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedItem,
  docState,
  onUpdateTextReplacement,
  onUpdateText,
  onUpdateShape,
  onUpdateImage,
  onUpdateSignature,
  onUpdateWhiteout,
  onUpdateStamp,
  onDeleteElement,
}) => {
  if (!selectedItem) {
    return (
      <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-slate-400 select-none hidden lg:flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
          <Palette className="w-6 h-6 text-slate-500" />
        </div>
        <h4 className="text-sm font-medium text-slate-300">Properties</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[180px]">
          Select any text, image, shape or signature to adjust its properties.
        </p>
      </aside>
    );
  }

  // Find the selected object from docState
  const replacement = docState.textReplacements.find((r) => r.id === selectedItem.id);
  const addedText = docState.addedTexts.find((t) => t.id === selectedItem.id);
  const shape = docState.shapes.find((s) => s.id === selectedItem.id);
  const image = docState.images.find((i) => i.id === selectedItem.id);
  const signature = docState.signatures.find((s) => s.id === selectedItem.id);
  const whiteout = docState.whiteouts.find((w) => w.id === selectedItem.id);
  const stamp = docState.stamps.find((st) => st.id === selectedItem.id);

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 select-none flex flex-col justify-between overflow-y-auto z-20">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {selectedItem.type.toUpperCase()} PROPERTIES
          </h4>
          <button
            onClick={() => onDeleteElement(selectedItem.id)}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
            title="Delete Selected Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Replacement Properties */}
        {replacement && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Replacement Text</label>
              <input
                type="text"
                value={replacement.newText}
                onChange={(e) =>
                  onUpdateTextReplacement(replacement.id, { newText: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Font Family</label>
              <select
                value={replacement.fontFamily}
                onChange={(e) =>
                  onUpdateTextReplacement(replacement.id, { fontFamily: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Font Size ({Math.round(replacement.fontSize)}pt)</label>
              <input
                type="range"
                min="8"
                max="72"
                value={Math.round(replacement.fontSize)}
                onChange={(e) =>
                  onUpdateTextReplacement(replacement.id, { fontSize: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateTextReplacement(replacement.id, {
                    fontWeight: replacement.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-2 rounded-lg border text-xs flex-1 flex justify-center transition ${
                  replacement.fontWeight === 'bold'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateTextReplacement(replacement.id, {
                    fontStyle: replacement.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-2 rounded-lg border text-xs flex-1 flex justify-center transition ${
                  replacement.fontStyle === 'italic'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Text Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateTextReplacement(replacement.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      replacement.color === c ? 'border-blue-400 scale-110' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Position Controls */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Position (pt)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">X (Horizontal)</span>
                  <input
                    type="number"
                    value={Math.round(replacement.x !== undefined ? replacement.x : replacement.originalBounds.x)}
                    onChange={(e) =>
                      onUpdateTextReplacement(replacement.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Y (Vertical)</span>
                  <input
                    type="number"
                    value={Math.round(replacement.y !== undefined ? replacement.y : replacement.originalBounds.y)}
                    onChange={(e) =>
                      onUpdateTextReplacement(replacement.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Drag on page or use Arrow keys (Shift+Arrow for 10pt)
              </p>
            </div>

            {/* Whitewash & Transparency Options */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={replacement.whitewashOriginal !== false}
                  onChange={(e) =>
                    onUpdateTextReplacement(replacement.id, {
                      whitewashOriginal: e.target.checked,
                    })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Whitewash original text before edit</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!replacement.backgroundColor || replacement.backgroundColor === 'transparent'}
                  onChange={(e) =>
                    onUpdateTextReplacement(replacement.id, {
                      backgroundColor: e.target.checked ? 'transparent' : '#ffffff',
                    })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Transparent box (never overlays lines)</span>
              </label>
            </div>
          </div>
        )}

        {/* Added Text Properties */}
        {addedText && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Text Content</label>
              <textarea
                rows={2}
                value={addedText.text}
                onChange={(e) => onUpdateText(addedText.id, { text: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Font Family</label>
              <select
                value={addedText.fontFamily}
                onChange={(e) => onUpdateText(addedText.id, { fontFamily: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Font Size ({Math.round(addedText.fontSize)}pt)</label>
              <input
                type="range"
                min="8"
                max="72"
                value={Math.round(addedText.fontSize)}
                onChange={(e) => onUpdateText(addedText.id, { fontSize: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateText(addedText.id, {
                    fontWeight: addedText.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-2 rounded-lg border text-xs flex-1 flex justify-center transition ${
                  addedText.fontWeight === 'bold'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateText(addedText.id, {
                    fontStyle: addedText.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-2 rounded-lg border text-xs flex-1 flex justify-center transition ${
                  addedText.fontStyle === 'italic'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateText(addedText.id, {
                    textDecoration:
                      addedText.textDecoration === 'underline' ? 'none' : 'underline',
                  })
                }
                className={`p-2 rounded-lg border text-xs flex-1 flex justify-center transition ${
                  addedText.textDecoration === 'underline'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateText(addedText.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      addedText.color === c ? 'border-blue-400 scale-110' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Opacity ({Math.round(addedText.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={addedText.opacity}
                onChange={(e) =>
                  onUpdateText(addedText.id, { opacity: Number(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
            </div>

            {/* Position Controls */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1 font-semibold">Position (pt)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">X (Horizontal)</span>
                  <input
                    type="number"
                    value={Math.round(addedText.x)}
                    onChange={(e) => onUpdateText(addedText.id, { x: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Y (Vertical)</span>
                  <input
                    type="number"
                    value={Math.round(addedText.y)}
                    onChange={(e) => onUpdateText(addedText.id, { y: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Drag on page or use Arrow keys (Shift+Arrow for 10pt)
              </p>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {shape && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Border Width ({shape.strokeWidth}px)</label>
              <input
                type="range"
                min="1"
                max="12"
                value={shape.strokeWidth}
                onChange={(e) => onUpdateShape(shape.id, { strokeWidth: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Stroke Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateShape(shape.id, { strokeColor: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      shape.strokeColor === c ? 'border-blue-400 scale-110' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Fill Color</label>
              <div className="flex flex-wrap gap-1.5 items-center">
                <button
                  onClick={() => onUpdateShape(shape.id, { fillColor: 'transparent' })}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                    shape.fillColor === 'transparent'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  None
                </button>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateShape(shape.id, { fillColor: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      shape.fillColor === c ? 'border-blue-400 scale-110' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Opacity ({Math.round(shape.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={shape.opacity}
                onChange={(e) => onUpdateShape(shape.id, { opacity: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )}

        {/* Signature & Image Properties */}
        {(signature || image) && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Opacity ({Math.round(((signature?.opacity ?? image?.opacity) || 1) * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={(signature?.opacity ?? image?.opacity) || 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (signature) onUpdateSignature(signature.id, { opacity: val });
                  if (image) onUpdateImage(image.id, { opacity: val });
                }}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Rotation</label>
              <button
                onClick={() => {
                  if (signature) {
                    onUpdateSignature(signature.id, {
                      rotation: ((signature.rotation || 0) + 90) % 360,
                    });
                  }
                  if (image) {
                    onUpdateImage(image.id, {
                      rotation: ((image.rotation || 0) + 90) % 360,
                    });
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate 90°</span>
              </button>
            </div>
          </div>
        )}

        {/* Whiteout Properties */}
        {whiteout && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              This area will be permanently covered by an opaque rectangle in the final exported PDF.
            </p>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Cover Color</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateWhiteout(whiteout.id, { color: '#ffffff' })}
                  className={`px-3 py-1 rounded-md text-xs border ${
                    whiteout.color === '#ffffff'
                      ? 'bg-white text-black font-semibold'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => onUpdateWhiteout(whiteout.id, { color: '#000000' })}
                  className={`px-3 py-1 rounded-md text-xs border ${
                    whiteout.color === '#000000'
                      ? 'bg-black text-white font-semibold border-slate-600'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  Black Redaction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Position saved in PDF points</span>
      </div>
    </aside>
  );
};
