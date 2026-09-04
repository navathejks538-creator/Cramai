import React, { useRef, useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  Camera,
  Layers,
  ArrowRight,
  HelpCircle,
  Zap,
  ShieldAlert,
  BookOpen,
  FileText,
  X,
  ZoomIn
} from 'lucide-react';
import { StudyAttachment, StudyMode } from '../types';
import { ModeSelector, getModeConfig } from './ModeSelector';
import { processSelectedFiles } from '../utils/fileHelpers';

interface StudyConsoleProps {
  currentMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  attachments: StudyAttachment[];
  onAddAttachments: (attachments: StudyAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  onOpenCamera: () => void;
  onPreviewImage: (url: string, name: string) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
}

const SAMPLE_PROMPTS: {
  topic: string;
  category: string;
  mode: StudyMode;
  prompt: string;
}[] = [
  {
    topic: "Newton's Second Law & Forces",
    category: 'Physics / Mechanics',
    mode: 'simple',
    prompt: "What is Newton's second law?"
  },
  {
    topic: 'Calculus: Directional Derivatives',
    category: 'STEM / Math',
    mode: 'step_solver',
    prompt: 'Find the directional derivative of f(x,y) = x^2 * e^(2y) at the point (2, 0) in the direction of v = <3, -4>. Show all formulas and verify step-by-step.'
  },
  {
    topic: 'Algorithms: Dynamic Programming Intuition',
    category: 'Computer Science',
    mode: 'deep_concept',
    prompt: 'Explain the core intuition of why the Greedy approach fails on the 0/1 Knapsack problem but Dynamic Programming succeeds. Give a clear counterexample.'
  },
  {
    topic: 'Organic Chemistry: SN1 vs SN2 Reactions',
    category: 'Chemistry / Pre-Med',
    mode: 'high_yield',
    prompt: 'Provide a high-yield exam cheat sheet comparing SN1 and SN2 mechanisms: substrates, nucleophile strength, solvent effects, stereochemistry, and rate laws.'
  },
  {
    topic: 'Neural Networks: Backpropagation Intuition',
    category: 'Machine Learning',
    mode: 'socratic',
    prompt: 'I understand the forward pass, but backpropagation chain rule confuses me. Can you walk me through the intuition one milestone at a time?'
  },
  {
    topic: 'Rotational Dynamics: Angular Momentum',
    category: 'Physics / Mechanics',
    mode: 'exam_traps',
    prompt: 'What are the most common exam traps students fall into when applying Conservation of Angular Momentum and rolling without slipping friction?'
  }
];

export const StudyConsole: React.FC<StudyConsoleProps> = ({
  currentMode,
  onSelectMode,
  inputPrompt,
  setInputPrompt,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onOpenCamera,
  onPreviewImage,
  onSubmit,
  isAnalyzing
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    onSelectMode(sample.mode);
    setInputPrompt(sample.prompt);
  };

  return (
    <div id="study-console-empty-state" className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your On-Demand University Study Copilot</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          What are you cramming right now?
        </h2>
        <p className="text-slate-500 text-sm mt-1 max-w-lg mx-auto">
          Drop complex homework problems, textbook diagrams, lecture slides, or exam review sheets for immediate AI breakdown.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mb-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <ModeSelector currentMode={currentMode} onSelectMode={onSelectMode} />
      </div>

      {/* Main Input Card with Multi-modal drop zone */}
      <div
        className={`bg-white rounded-2xl border transition-all shadow-xs p-4 sm:p-5 ${
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
          placeholder="Paste or type your question, problem statement, or concept here..."
          className="w-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden resize-none"
        />

        {/* Uploaded attachments preview strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 my-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs group relative"
              >
                {att.previewUrl ? (
                  <div
                    className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-100 cursor-pointer"
                    onClick={() => onPreviewImage(att.previewUrl!, att.name)}
                  >
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[140px]">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
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

        {/* Attachment drop & snap trigger bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2">
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
              id="initial-upload-files-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Files or Images</span>
            </button>

            <button
              type="button"
              id="initial-snap-camera-btn"
              onClick={onOpenCamera}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snap with Camera</span>
            </button>
          </div>

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
            <span>Analyze with Cram AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Starter Subjects */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Practice & Topic Templates
          </h3>
          <span className="text-xs text-slate-400">Click to load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SAMPLE_PROMPTS.map((sample, idx) => {
            const config = getModeConfig(sample.mode);
            const ModeIcon = config.icon;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="flex flex-col items-start p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full mb-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                    {sample.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                    <ModeIcon className="w-3 h-3" />
                    <span>{config.name}</span>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {sample.topic}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {sample.prompt}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
