import React from 'react';
import {
  Sparkles,
  History,
  Plus,
  Trash2,
  Cpu
} from 'lucide-react';
import { StudyMode } from '../types';
import { getModeConfig } from './ModeSelector';

interface HeaderProps {
  currentMode: StudyMode;
  sessionCount: number;
  hasActiveMessages: boolean;
  onOpenHistory: () => void;
  onNewSession: () => void;
  onClearSession: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  sessionCount,
  hasActiveMessages,
  onOpenHistory,
  onNewSession,
  onClearSession,
  isAnalyzing
}) => {
  const activeModeConfig = getModeConfig(currentMode);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                Cram AI
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Study Helper
              </span>
              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeModeConfig.activeBg} ${activeModeConfig.activeBorder} ${activeModeConfig.activeText}`}>
                {activeModeConfig.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Multi-Modal Academic Problem Solver & Exam Prep Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <Cpu className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Gemini 2.5 Flash'}</span>
          </div>

          {/* History Button */}
          <button
            type="button"
            id="history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Study History"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">History</span>
            {sessionCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                {sessionCount}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            id="new-chat-btn"
            onClick={onNewSession}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {/* Clear Current Button */}
          {hasActiveMessages && (
            <button
              type="button"
              id="clear-session-btn"
              onClick={onClearSession}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear current study session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
