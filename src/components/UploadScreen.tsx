import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { loadPDFDocument, readFileAsArrayBuffer } from '../lib/pdf/pdfLoader';
import { generateSampleInvoicePDF } from '../lib/pdf/sampleInvoice';
import { PageInfo } from '../types/pdf';

interface UploadScreenProps {
  onDocumentLoaded: (
    pdfBytes: Uint8Array,
    fileName: string,
    pages: PageInfo[],
    file: File | null
  ) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onDocumentLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a genuine .pdf file.');
      return;
    }

    // Validate size (e.g. 50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum supported PDF size is 50MB.');
      return;
    }

    try {
      setIsLoading(true);
      const bytes = await readFileAsArrayBuffer(file);
      const loaded = await loadPDFDocument(bytes);
      onDocumentLoaded(loaded.pdfBytes, file.name, loaded.pages, file);
    } catch (err: any) {
      console.error('Failed to open PDF:', err);
      setError(err?.message || 'Corrupted or unreadable PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const handleLoadSampleInvoice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bytes = await generateSampleInvoicePDF();
      const loaded = await loadPDFDocument(bytes);
      onDocumentLoaded(loaded.pdfBytes, 'Sample_Invoice_INV001.pdf', loaded.pages, null);
    } catch (err: any) {
      console.error('Failed to generate sample invoice:', err);
      setError('Failed to generate sample invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Brand Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">PDF Editor</h1>
            <p className="text-xs text-slate-400 m-0">Production Client-Side Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Private (Runs locally in browser)</span>
          </div>
        </div>
      </header>

      {/* Main Upload Center */}
      <main className="max-w-2xl mx-auto w-full my-auto py-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-3">
            Edit Your PDF
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto">
            Edit text, images, signatures and annotations directly in your PDF.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Upload failed: </span>
              {error}
            </div>
          </div>
        )}

        {/* Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-12 text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-850 shadow-2xl'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-inner">
            {isLoading ? (
              <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">
            Drag &amp; Drop PDF Here
          </h3>
          <p className="text-sm text-slate-400 mb-6">OR</p>

          <button
            type="button"
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
          >
            {isLoading ? 'Processing PDF...' : 'Choose PDF'}
          </button>

          <div className="mt-6 text-xs text-slate-500">
            Accepts only genuine .pdf files up to 50MB
          </div>
        </div>

        {/* Sample Invoice Test Section */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px bg-slate-800 flex-1 max-w-[100px]" />
            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              Want to test right away?
            </span>
            <span className="h-px bg-slate-800 flex-1 max-w-[100px]" />
          </div>

          <button
            type="button"
            onClick={handleLoadSampleInvoice}
            disabled={isLoading}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Load Sample Invoice (Rahul Kumar, INV-001)</span>
          </button>
        </div>
      </main>

      {/* Feature Badges */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-3">
          <h4 className="text-sm font-semibold text-slate-300">True PDF Export</h4>
          <p className="text-xs text-slate-500 mt-1">Changes are written directly into PDF binary, not screenshots or canvas overlays.</p>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-semibold text-slate-300">Existing Text Editing</h4>
          <p className="text-xs text-slate-500 mt-1">Extracts baseline coordinates, covers original text, and writes new typography.</p>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-semibold text-slate-300">Universal Compatibility</h4>
          <p className="text-xs text-slate-500 mt-1">Exported PDFs open natively in Adobe Acrobat, Chrome, Edge, and PDF.js.</p>
        </div>
      </footer>
    </div>
  );
};
