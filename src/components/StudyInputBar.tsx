import React, { useRef, useState } from 'react';
import {
  Send,
  Plus,
  Camera,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
  ZoomIn
} from 'lucide-react';
import { StudyAttachment, StudyMode } from '../types';
import { processSelectedFiles } from '../utils/fileHelpers';
import { ActiveContextCard } from './ActiveContextCard';

interface StudyInputBarProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
  attachments: StudyAttachment[];
  onAddAttachments: (newAttachments: StudyAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onOpenCamera: () => void;
  onOpenPasteModal: () => void;
  onPreviewImage: (url: string, name: string) => void;
  currentMode: StudyMode;
  activeContextAttachment?: StudyAttachment | null;
  onClearActiveContext?: () => void;
}

export const StudyInputBar: React.FC<StudyInputBarProps> = ({
  inputPrompt,
  setInputPrompt,
  onSubmit,
  isAnalyzing,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onOpenCamera,
  onOpenPasteModal,
  onPreviewImage,
  currentMode,
  activeContextAttachment,
  onClearActiveContext
}) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const processed = await processSelectedFiles(e.target.files);
      onAddAttachments(processed);
      e.target.value = '';
    }
    setIsAttachMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isAnalyzing && (inputPrompt.trim() || attachments.length > 0 || activeContextAttachment)) {
        onSubmit();
      }
    }
  };

  const getLoadingMessage = () => {
    const hasImage = attachments.some(a => a.mimeType.startsWith('image/') || !!a.previewUrl) ||
      (activeContextAttachment && (activeContextAttachment.mimeType.startsWith('image/') || !!activeContextAttachment.previewUrl));
    const hasPdf = attachments.some(a => a.mimeType.includes('pdf') || a.name.endsWith('.pdf')) ||
      (activeContextAttachment && (activeContextAttachment.mimeType.includes('pdf') || activeContextAttachment.name.endsWith('.pdf')));
    const hasPasted = attachments.some(a => a.sourceType === 'pasted') ||
      (activeContextAttachment && activeContextAttachment.sourceType === 'pasted');

    if (hasImage) return 'Analyzing your image...';
    if (hasPdf) return 'Reading your study material...';
    if (hasPasted) return 'Analyzing your material...';
    return 'Cram AI is thinking...';
  };

  const getPlaceholder = () => {
    switch (currentMode) {
      case 'simple':
        return 'Ask for a short, direct answer... (Press Enter)';
      case 'step_solver':
        return 'Ask for step-by-step resolution... (Press Enter)';
      case 'deep_concept':
        return 'Ask to unpack intuition & why...';
      case 'high_yield':
        return 'Ask for high-yield exam essentials...';
      case 'socratic':
        return 'Ask a problem to solve collaboratively with hints...';
      case 'exam_traps':
        return 'Ask for common mistakes and exam traps...';
      default:
        return 'Ask Cram AI a question...';
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pt-2 pb-4 px-3 sm:px-6 z-20">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Hidden inputs */}
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept="application/pdf,text/*,.txt,.md,.py,.java,.cpp,.csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Active Material Context Card */}
        {activeContextAttachment && onClearActiveContext && (
          <div className="flex items-center">
            <ActiveContextCard
              attachment={activeContextAttachment}
              onRemove={onClearActiveContext}
              onPreviewImage={onPreviewImage}
            />
          </div>
        )}

        {/* Queued Attachments Preview Strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs group relative"
              >
                {att.previewUrl ? (
                  <div
                    className="relative w-9 h-9 rounded-md overflow-hidden bg-slate-100 cursor-pointer"
                    onClick={() => onPreviewImage(att.previewUrl!, att.name)}
                  >
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[120px] sm:max-w-[180px]">
                  <p className="text-[11px] font-medium text-slate-800 truncate">
                    {att.name}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {(att.size / 1024).toFixed(0)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300/80 rounded-2xl p-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xs">
          {/* Action Popover Menu Trigger */}
          <div className="relative pb-1">
            <button
              type="button"
              id="attach-file-btn"
              disabled={isAnalyzing}
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Add attachment"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Dropdown Popover */}
            {isAttachMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsAttachMenuOpen(false)}
                />
                <div className="absolute left-0 bottom-full mb-2 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      imageInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      docInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>Upload PDF / TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      onOpenPasteModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-sm">📝</span>
                    <span>Paste Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      onOpenCamera();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left cursor-pointer border-t border-slate-100"
                  >
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Snap with Camera</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Textarea */}
          <textarea
            id="study-input-textarea"
            rows={1}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isAnalyzing}
            className="flex-1 max-h-36 min-h-[38px] bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden resize-none py-2 px-1"
          />

          {/* Send Button */}
          <div className="pb-1">
            <button
              type="button"
              id="submit-study-prompt-btn"
              disabled={isAnalyzing || (!inputPrompt.trim() && attachments.length === 0 && !activeContextAttachment)}
              onClick={onSubmit}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isAnalyzing || (!inputPrompt.trim() && attachments.length === 0 && !activeContextAttachment)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 cursor-pointer'
              }`}
              title="Send to Cram AI (Enter)"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Loading status or footer hints */}
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 px-1 py-0.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{getLoadingMessage()}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Enter to send • Shift+Enter for new line</span>
            <span>Upload images, PDFs, or paste notes</span>
          </div>
        )}
      </div>
    </div>
  );
};
