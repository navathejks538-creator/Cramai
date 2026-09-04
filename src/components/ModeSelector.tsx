import React from 'react';
import { StudyMode } from '../types';
import {
  Sparkles,
  Layers,
  BookOpen,
  Zap,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

interface ModeSelectorProps {
  currentMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

export interface ModeConfig {
  id: StudyMode;
  name: string;
  shortName: string;
  tagline: string;
  mindset: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeRing: string;
  activeText: string;
  iconBg: string;
  badgeDot: string;
}

export const STUDY_MODES: ModeConfig[] = [
  {
    id: 'simple',
    name: 'Simple',
    shortName: 'Simple',
    tagline: 'Short & clear answers',
    mindset: 'Just give me the answer',
    icon: Sparkles,
    color: 'purple',
    activeBg: 'bg-purple-50/90',
    activeBorder: 'border-purple-500',
    activeRing: 'ring-purple-500/20',
    activeText: 'text-purple-950',
    iconBg: 'bg-purple-600',
    badgeDot: 'bg-purple-500'
  },
  {
    id: 'step_solver',
    name: 'Step Solver',
    shortName: 'Step Solver',
    tagline: 'Detailed step-by-step work',
    mindset: 'Show me how to solve it',
    icon: Layers,
    color: 'indigo',
    activeBg: 'bg-indigo-50/90',
    activeBorder: 'border-indigo-500',
    activeRing: 'ring-indigo-500/20',
    activeText: 'text-indigo-950',
    iconBg: 'bg-indigo-600',
    badgeDot: 'bg-indigo-500'
  },
  {
    id: 'deep_concept',
    name: 'Deep Concept',
    shortName: 'Deep Concept',
    tagline: 'Understand the WHY',
    mindset: 'Help me truly understand it',
    icon: BookOpen,
    color: 'emerald',
    activeBg: 'bg-emerald-50/90',
    activeBorder: 'border-emerald-500',
    activeRing: 'ring-emerald-500/20',
    activeText: 'text-emerald-950',
    iconBg: 'bg-emerald-600',
    badgeDot: 'bg-emerald-500'
  },
  {
    id: 'high_yield',
    name: 'High-Yield',
    shortName: 'High-Yield',
    tagline: 'Exam essentials',
    mindset: 'Give me what I need for exam',
    icon: Zap,
    color: 'amber',
    activeBg: 'bg-amber-50/90',
    activeBorder: 'border-amber-500',
    activeRing: 'ring-amber-500/20',
    activeText: 'text-amber-950',
    iconBg: 'bg-amber-600',
    badgeDot: 'bg-amber-500'
  },
  {
    id: 'socratic',
    name: 'Socratic',
    shortName: 'Socratic',
    tagline: 'Learn through hints',
    mindset: 'Help me figure it out myself',
    icon: HelpCircle,
    color: 'orange',
    activeBg: 'bg-orange-50/90',
    activeBorder: 'border-orange-500',
    activeRing: 'ring-orange-500/20',
    activeText: 'text-orange-950',
    iconBg: 'bg-orange-600',
    badgeDot: 'bg-orange-500'
  },
  {
    id: 'exam_traps',
    name: 'Exam Traps',
    shortName: 'Exam Traps',
    tagline: 'Avoid common mistakes',
    mindset: 'Tell me what mistakes to avoid',
    icon: ShieldAlert,
    color: 'rose',
    activeBg: 'bg-rose-50/90',
    activeBorder: 'border-rose-500',
    activeRing: 'ring-rose-500/20',
    activeText: 'text-rose-950',
    iconBg: 'bg-rose-600',
    badgeDot: 'bg-rose-500'
  }
];

export function getModeConfig(mode?: string): ModeConfig {
  // Normalize legacy keys
  const normalized = mode === 'step_by_step'
    ? 'step_solver'
    : mode === 'deep_dive'
    ? 'deep_concept'
    : mode;

  return STUDY_MODES.find(m => m.id === normalized) || STUDY_MODES[0];
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
  compact = false
}) => {
  const activeConfig = getModeConfig(currentMode);

  return (
    <div id="study-mode-selector" className="w-full">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Study Mode
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Active: <strong className="text-slate-900">{activeConfig.name}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 italic hidden sm:inline truncate max-w-xs">
          "{activeConfig.mindset}"
        </span>
      </div>

      {/* Grid of modes: 2 cols on mobile, 3 cols on tablet, 6 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STUDY_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = activeConfig.id === mode.id;

          return (
            <button
              key={mode.id}
              id={`mode-btn-${mode.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(mode.id)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? `${mode.activeBg} ${mode.activeBorder} ${mode.activeText} shadow-xs ring-2 ${mode.activeRing}`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isSelected
                      ? `${mode.iconBg} text-white shadow-2xs`
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold truncate block tracking-tight">
                    {mode.name}
                  </span>
                </div>
              </div>

              {!compact && (
                <span
                  className={`text-[11px] leading-snug mt-1.5 line-clamp-2 ${
                    isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'
                  }`}
                >
                  {mode.tagline}
                </span>
              )}

              {isSelected && (
                <span
                  className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${mode.badgeDot}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
