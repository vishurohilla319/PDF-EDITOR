import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageToolProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (dataUrl: string, mimeType: 'image/png' | 'image/jpeg') => void;
}

export const ImageTool: React.FC<ImageToolProps> = ({
  isOpen,
  onClose,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result, mimeType);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Insert Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/50 transition group"
          >
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mx-auto mb-3 transition" />
            <p className="text-sm font-medium text-white mb-1">Click to select an image</p>
            <p className="text-xs text-slate-500">Supports PNG, JPG, JPEG, WEBP</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
