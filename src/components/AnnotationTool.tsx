import React, { useState } from 'react';
import { X, Highlighter, MessageSquare } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '../lib/pdf/annotations';

interface AnnotationToolProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'highlight' | 'comment';
  onApplyHighlightColor: (color: string) => void;
  onAddComment: (text: string, author: string) => void;
}

export const AnnotationTool: React.FC<AnnotationToolProps> = ({
  isOpen,
  onClose,
  type,
  onApplyHighlightColor,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('User');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            {type === 'highlight' ? (
              <Highlighter className="w-4 h-4 text-amber-400" />
            ) : (
              <MessageSquare className="w-4 h-4 text-blue-400" />
            )}
            <h3 className="text-sm font-semibold text-white">
              {type === 'highlight' ? 'Highlight Color' : 'Add Sticky Note Comment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {type === 'highlight' && (
          <div>
            <p className="text-xs text-slate-400 mb-3">
              Select highlight color and drag over any area on the page:
            </p>
            <div className="flex items-center justify-center gap-3 py-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onApplyHighlightColor(c);
                    onClose();
                  }}
                  style={{ backgroundColor: c }}
                  className="w-8 h-8 rounded-full border border-slate-700 hover:scale-110 transition shadow"
                />
              ))}
            </div>
          </div>
        )}

        {type === 'comment' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Author</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Comment</label>
              <textarea
                rows={3}
                placeholder="Type your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!commentText.trim()}
                onClick={() => {
                  onAddComment(commentText, authorName);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                Place Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
