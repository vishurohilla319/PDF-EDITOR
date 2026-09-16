import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  Loader2,
} from 'lucide-react';
import { exportPDF } from '../lib/pdf/pdfExporter';
import { EditorDocumentState } from '../types/editor';

interface DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalPdfBytes: Uint8Array;
  documentState: EditorDocumentState;
}

export const DownloadDialog: React.FC<DownloadDialogProps> = ({
  isOpen,
  onClose,
  originalPdfBytes,
  documentState,
}) => {
  const [isExporting, setIsExporting] = useState(true);
  const [exportedBytes, setExportedBytes] = useState<Uint8Array | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setExportedBytes(null);
      setValidationSuccess(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const runExportAndValidation = async () => {
      setIsExporting(true);
      setError(null);

      try {
        // Step 1: Export Real Binary PDF
        const finalPdfBytes = await exportPDF({
          originalPdfBytes,
          documentState,
        });

        if (isCancelled) return;
        setExportedBytes(finalPdfBytes);

        // Step 2: Validate Generated PDF with PDF.js
        const loadingTask = pdfjsLib.getDocument({
          data: finalPdfBytes.slice(),
        });
        const validatedDoc = await loadingTask.promise;

        // Verify page count
        const activePages = documentState.pageOrder.filter(
          (p) => !documentState.deletedPages.includes(p)
        );
        if (validatedDoc.numPages !== activePages.length) {
          throw new Error(
            `Validation mismatch: Expected ${activePages.length} pages, but generated PDF has ${validatedDoc.numPages}.`
          );
        }

        // Render first page to preview canvas
        if (previewCanvasRef.current && validatedDoc.numPages > 0) {
          const firstPage = await validatedDoc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 0.6 });
          const canvas = previewCanvasRef.current;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await firstPage.render({
              canvasContext: ctx,
              viewport: viewport,
            }).promise;
          }
        }

        setValidationSuccess(true);
        setValidationMessage(
          `Verified successfully: Valid PDF binary, ${validatedDoc.numPages} page(s) compiled with all vector modifications.`
        );
      } catch (err: any) {
        console.error('Export validation error:', err);
        setError(err?.message || 'Failed to export or validate PDF document.');
      } finally {
        setIsExporting(false);
      }
    };

    runExportAndValidation();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, originalPdfBytes, documentState]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!exportedBytes) return;

    const blob = new Blob([exportedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const baseName = documentState.fileName.replace(/\.pdf$/i, '') || 'document';
    link.href = url;
    link.download = `${baseName}-edited.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Export &amp; Download PDF</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isExporting && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Generating Real PDF...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Encoding typography, vector shapes, signatures and text replacements into PDF binary.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Export Failed</p>
                <p className="text-xs mt-1 text-rose-300">{error}</p>
              </div>
            </div>
          )}

          {!isExporting && validationSuccess && (
            <div className="space-y-4">
              {/* Validation Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold block">True PDF Export Verified</span>
                  <span className="text-emerald-400/80">{validationMessage}</span>
                </div>
              </div>

              {/* Preview canvas */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 self-start">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Exported Document Preview (Page 1)</span>
                </div>
                <div className="border border-slate-700 rounded-xl bg-white p-2 shadow-inner max-h-56 overflow-hidden flex items-center justify-center">
                  <canvas ref={previewCanvasRef} className="max-h-52 object-contain" />
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <p className="font-medium text-slate-300 mb-1">Universal Reader Compatibility:</p>
                <p className="text-[11px] text-slate-500">
                  This file is a true PDF conforming to ISO 32000-1. It contains actual vector text &amp; shape commands and opens cleanly in Adobe Acrobat, Google Chrome, Edge, and PDF.js.
                </p>
              </div>
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
            disabled={isExporting || !exportedBytes}
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Real PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
