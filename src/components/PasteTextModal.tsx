import React, { useState } from 'react';
import { FileText, X, Check } from 'lucide-react';
import { StudyAttachment } from '../types';

interface PasteTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPastedText: (attachment: StudyAttachment) => void;
}

export const PasteTextModal: React.FC<PasteTextModalProps> = ({
  isOpen,
  onClose,
  onAddPastedText
}) => {
  const [title, setTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const text = pastedContent.trim();
    if (!text) return;

    const attachmentTitle = title.trim() || 'Pasted Study Material';
    // Encode text to base64
    const utf8Bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Data = btoa(binary);
    const dataUrl = `data:text/plain;base64,${base64Data}`;

    const attachment: StudyAttachment = {
      id: `att_paste_${Date.now()}`,
      name: attachmentTitle,
      size: utf8Bytes.length,
      mimeType: 'text/plain',
      data: dataUrl,
      sourceType: 'pasted',
      rawText: text
    };

    onAddPastedText(attachment);
    setTitle('');
    setPastedContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Paste Study Material</h3>
              <p className="text-[11px] text-slate-500">
                Paste lecture notes, syllabus, reading excerpt, or practice problem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Lecture Notes, Syllabus, Problem 3"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Text Content
              </label>
              <span className="text-[10px] text-slate-400">
                {pastedContent.trim().length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your study material here..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!pastedContent.trim()}
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              !pastedContent.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 cursor-pointer'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Add to Study Material</span>
          </button>
        </div>
      </div>
    </div>
  );
};
