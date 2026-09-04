import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Camera,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Plus,
  Loader2
} from 'lucide-react';
import { StudyAttachment, StudyMode, AnswerLength } from '../types';
import { ModeSelector } from './ModeSelector';
import { processSelectedFiles } from '../utils/fileHelpers';
import { ActiveContextCard } from './ActiveContextCard';

interface StudyConsoleProps {
  currentMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  answerLength?: AnswerLength;
  onSelectAnswerLength?: (len: AnswerLength) => void;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  attachments: StudyAttachment[];
  onAddAttachments: (attachments: StudyAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onOpenCamera: () => void;
  onOpenPasteModal: () => void;
  onPreviewImage: (url: string, name: string) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
}

const TRY_PROMPTS: { label: string; prompt: string; mode?: StudyMode }[] = [
  {
    label: 'Explain this simply',
    prompt: 'Can you explain this concept simply so I can understand the core idea fast?',
    mode: 'simple'
  },
  {
    label: 'Solve this step-by-step',
    prompt: 'Please solve this problem step-by-step, showing all formulas, substitutions, and calculations.',
    mode: 'step_solver'
  },
  {
    label: 'Analyze my study material',
    prompt: 'Please analyze my study material and give me a clear breakdown of the key concepts and formulas.',
    mode: 'simple'
  }
];

export const StudyConsole: React.FC<StudyConsoleProps> = ({
  currentMode,
  onSelectMode,
  answerLength = 'balanced',
  onSelectAnswerLength,
  inputPrompt,
  setInputPrompt,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onOpenCamera,
  onOpenPasteModal,
  onPreviewImage,
  onSubmit,
  isAnalyzing
}) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const processed = await processSelectedFiles(e.dataTransfer.files);
      onAddAttachments(processed);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const processed = await processSelectedFiles(e.target.files);
      onAddAttachments(processed);
      e.target.value = '';
    }
    setIsAttachMenuOpen(false);
  };

  const handleSelectTryPrompt = (item: typeof TRY_PROMPTS[0]) => {
    if (item.mode) {
      onSelectMode(item.mode);
    }
    setInputPrompt(item.prompt);
  };

  const getLoadingMessage = () => {
    const hasImage = attachments.some(a => a.mimeType.startsWith('image/') || !!a.previewUrl);
    const hasPdf = attachments.some(a => a.mimeType.includes('pdf') || a.name.endsWith('.pdf'));
    const hasPasted = attachments.some(a => a.sourceType === 'pasted');

    if (hasImage) return 'Analyzing your image...';
    if (hasPdf) return 'Reading your study material...';
    if (hasPasted) return 'Analyzing your material...';
    return 'Cram AI is thinking...';
  };

  return (
    <div id="study-console-empty-state" className="max-w-3xl mx-auto py-6 px-3 sm:px-6">
      {/* Hidden file inputs for dedicated attachments */}
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

      {/* Hero Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Study Helper</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          What are you cramming right now?
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
          Ask questions, solve problems, or upload lecture notes & diagrams for instant breakdown.
        </p>
      </div>

      {/* Compact Study Mode + Length Selection */}
      <div className="mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <ModeSelector
          currentMode={currentMode}
          onSelectMode={onSelectMode}
          answerLength={answerLength}
          onSelectAnswerLength={onSelectAnswerLength}
          disabled={isAnalyzing}
        />
      </div>

      {/* Active Material Context Cards if attachments exist */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <ActiveContextCard
              key={att.id}
              attachment={att}
              onRemove={() => onRemoveAttachment(att.id)}
              onPreviewImage={onPreviewImage}
            />
          ))}
        </div>
      )}

      {/* Main Input Card */}
      <div
        className={`bg-white rounded-2xl border transition-all shadow-xs p-3.5 sm:p-4.5 ${
          isDragOver
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Text prompt area */}
        <textarea
          id="initial-study-prompt"
          rows={3}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isAnalyzing}
          placeholder="Type your question, paste notes, or describe what you need help with..."
          className="w-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden resize-none"
        />

        {/* Action bar: Attachment popover + Submit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2">
          <div className="relative">
            {/* Attachment Button */}
            <button
              type="button"
              id="initial-attach-menu-btn"
              disabled={isAnalyzing}
              onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Material</span>
            </button>

            {/* Dropdown Popover */}
            {isAttachMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsAttachMenuOpen(false)}
                />
                <div className="absolute left-0 bottom-full mb-1.5 z-30 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-xs animate-in fade-in">
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

          {/* Submit Button */}
          <button
            type="button"
            id="start-study-session-btn"
            disabled={isAnalyzing || (!inputPrompt.trim() && attachments.length === 0)}
            onClick={onSubmit}
            className={`flex items-center gap-2 font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all ${
              isAnalyzing || (!inputPrompt.trim() && attachments.length === 0)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 cursor-pointer hover:shadow-md'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{getLoadingMessage()}</span>
              </>
            ) : (
              <>
                <span>Ask Cram AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightweight "Try asking Cram AI" prompt chips */}
      <div className="mt-5 pt-3 border-t border-slate-200/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Try asking Cram AI:
          </span>
          <span className="text-[10px] text-slate-400">Click to fill</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRY_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTryPrompt(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            >
              <span className="text-indigo-500 font-bold">•</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
