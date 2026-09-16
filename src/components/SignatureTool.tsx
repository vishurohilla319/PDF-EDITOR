import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Trash2, Pen, Type, Upload as UploadIcon } from 'lucide-react';

interface SignatureToolProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export const SignatureTool: React.FC<SignatureToolProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');

  // Type State
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');

  // Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = strokeColor;
      }
    }
  }, [isOpen, activeTab, strokeColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onSaveSignature(canvas.toDataURL('image/png'));
      onClose();
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;

      // Render typed text to temporary canvas to create transparent PNG
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 160;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.fillStyle = strokeColor;
        ctx.font = `italic 42px ${selectedFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, tempCanvas.width / 2, tempCanvas.height / 2);
        onSaveSignature(tempCanvas.toDataURL('image/png'));
        onClose();
      }
    } else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      onSaveSignature(uploadedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">Create Signature</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'draw'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'type'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadIcon className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'draw' && (
            <div>
              <div className="relative border border-slate-700 rounded-xl bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm select-none">
                    Sign here with your mouse or stylus
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                {/* Color choices */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Color:</span>
                  {['#000000', '#1d4ed8', '#b91c1c'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setStrokeColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 transition ${
                        strokeColor === c ? 'border-blue-400 scale-110' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Font previews */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 block">Select Style:</span>
                {[
                  { id: 'cursive', name: 'Elegant Cursive' },
                  { id: 'Brush Script MT, cursive', name: 'Brush Script' },
                  { id: 'Segoe Script, cursive', name: 'Casual Hand' },
                  { id: 'Lucinda Handwriting, cursive', name: 'Classic Script' },
                ].map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFont(f.id)}
                    style={{ fontFamily: f.id }}
                    className={`p-3 rounded-xl border text-xl text-center cursor-pointer transition ${
                      selectedFont === f.id
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {typedName || 'Your Signature'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />

              {uploadedImage && (
                <div className="mt-4 p-4 border border-slate-700 rounded-xl bg-white flex items-center justify-center max-h-48 overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Uploaded Signature"
                    className="max-h-36 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
