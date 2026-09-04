import React, { useRef } from 'react';
import {
  Send,
  Paperclip,
  Camera,
  X,
  FileText,
  Loader2,
  ZoomIn
} from 'lucide-react';
import { StudyAttachment, StudyMode } from '../types';
import { processSelectedFiles } from '../utils/fileHelpers';

interface StudyInputBarProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
  attachments: StudyAttachment[];
  onAddAttachments: (newAttachments: StudyAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onOpenCamera: () => void;
  onPreviewImage: (url: string, name: string) => void;
  currentMode: StudyMode;
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
  onPreviewImage,
  currentMode
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const processed = await processSelectedFiles(e.target.files);
      onAddAttachments(processed);
      // Reset input value so same file can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isAnalyzing && (inputPrompt.trim() || attachments.length > 0)) {
        onSubmit();
      }
    }
  };

  const getPlaceholder = () => {
    switch (currentMode) {
      case 'simple':
        return 'Ask a question for a short, direct answer... (Press Enter)';
      case 'step_solver':
        return 'Paste a problem for clear step-by-step resolution... (Press Enter)';
      case 'deep_concept':
        return 'Enter a complex concept to unpack with intuition & first principles...';
      case 'high_yield':
        return 'Enter topic for high-yield exam essentials & memory points...';
      case 'socratic':
        return 'Ask a problem or concept to solve collaboratively with guided hints...';
      case 'exam_traps':
        return 'Enter topic to identify tricky exam traps and avoid common mistakes...';
      default:
        return 'Ask anything or paste problem details...';
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pt-2 pb-4 px-4 sm:px-6 z-20">
      <div className="max-w-4xl mx-auto">
        {/* Queued Attachments Preview Strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
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
          {/* Action buttons (File upload, Camera) */}
          <div className="flex items-center gap-1 pb-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,text/*,.txt,.md,.py,.java,.cpp,.csv,.json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              id="attach-file-btn"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Attach images, PDFs, or documents"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="open-camera-btn"
              onClick={onOpenCamera}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Snap textbook or notes photo"
            >
              <Camera className="w-4 h-4" />
            </button>
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
              disabled={isAnalyzing || (!inputPrompt.trim() && attachments.length === 0)}
              onClick={onSubmit}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isAnalyzing || (!inputPrompt.trim() && attachments.length === 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 cursor-pointer'
              }`}
              title="Send to Cram AI (Enter)"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Small footer tips */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
          <span>Enter to submit • Shift+Enter for new line</span>
          <span>Upload images, PDFs, or snap diagrams</span>
        </div>
      </div>
    </div>
  );
};
