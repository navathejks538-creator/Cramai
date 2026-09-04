import React from 'react';
import { StudyMode, AnswerLength } from '../types';
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
  answerLength?: AnswerLength;
  onSelectAnswerLength?: (length: AnswerLength) => void;
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
    tagline: 'Simple = short, clear answer',
    mindset: 'Just give me the answer',
    icon: Sparkles,
    color: 'purple',
    activeBg: 'bg-purple-50/90',
    activeBorder: 'border-purple-500',
    activeRing: 'ring-purple-500/20',
    activeText: 'text-purple-900',
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
    activeText: 'text-indigo-900',
    iconBg: 'bg-indigo-600',
    badgeDot: 'bg-indigo-500'
  },
  {
    id: 'deep_concept',
    name: 'Deep Concept',
    shortName: 'Deep Concept',
    tagline: 'Understand the intuitive WHY',
    mindset: 'Help me truly understand it',
    icon: BookOpen,
    color: 'emerald',
    activeBg: 'bg-emerald-50/90',
    activeBorder: 'border-emerald-500',
    activeRing: 'ring-emerald-500/20',
    activeText: 'text-emerald-900',
    iconBg: 'bg-emerald-600',
    badgeDot: 'bg-emerald-500'
  },
  {
    id: 'high_yield',
    name: 'High-Yield',
    shortName: 'High-Yield',
    tagline: 'Exam essentials & core facts',
    mindset: 'Give me what I need for exam',
    icon: Zap,
    color: 'amber',
    activeBg: 'bg-amber-50/90',
    activeBorder: 'border-amber-500',
    activeRing: 'ring-amber-500/20',
    activeText: 'text-amber-900',
    iconBg: 'bg-amber-600',
    badgeDot: 'bg-amber-500'
  },
  {
    id: 'socratic',
    name: 'Socratic',
    shortName: 'Socratic',
    tagline: 'Learn through guided hints',
    mindset: 'Help me figure it out myself',
    icon: HelpCircle,
    color: 'orange',
    activeBg: 'bg-orange-50/90',
    activeBorder: 'border-orange-500',
    activeRing: 'ring-orange-500/20',
    activeText: 'text-orange-900',
    iconBg: 'bg-orange-600',
    badgeDot: 'bg-orange-500'
  },
  {
    id: 'exam_traps',
    name: 'Exam Traps',
    shortName: 'Exam Traps',
    tagline: 'Avoid common pitfalls & mistakes',
    mindset: 'Tell me what mistakes to avoid',
    icon: ShieldAlert,
    color: 'rose',
    activeBg: 'bg-rose-50/90',
    activeBorder: 'border-rose-500',
    activeRing: 'ring-rose-500/20',
    activeText: 'text-rose-900',
    iconBg: 'bg-rose-600',
    badgeDot: 'bg-rose-500'
  }
];

export function getModeConfig(mode?: string): ModeConfig {
  const normalized = mode === 'step_by_step'
    ? 'step_solver'
    : mode === 'deep_dive'
    ? 'deep_concept'
    : mode;

  return STUDY_MODES.find(m => m.id === normalized) || STUDY_MODES[0];
}

const LENGTH_OPTIONS: { id: AnswerLength; label: string; desc: string }[] = [
  { id: 'short', label: 'Short', desc: '1–4 sentences or concise bullets' },
  { id: 'balanced', label: 'Balanced', desc: 'Standard helpful explanation (100–250 words)' },
  { id: 'detailed', label: 'Detailed', desc: 'Thorough & comprehensive breakdown' }
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  answerLength = 'balanced',
  onSelectAnswerLength,
  disabled = false,
  compact = false
}) => {
  const activeConfig = getModeConfig(currentMode);

  return (
    <div id="study-mode-selector" className="w-full space-y-2">
      {/* Header bar with Active Mode & Tagline */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Study Mode
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            {activeConfig.name}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 truncate max-w-xs font-medium">
          {activeConfig.tagline}
        </span>
      </div>

      {/* Compact 3-col (mobile) / 6-col (desktop) layout */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 py-2 rounded-xl border text-left transition-all ${
                isSelected
                  ? `${mode.activeBg} ${mode.activeBorder} ${mode.activeText} font-bold shadow-xs ring-2 ${mode.activeRing}`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
              title={`${mode.name}: ${mode.tagline}`}
            >
              <div
                className={`p-1 rounded-md shrink-0 ${
                  isSelected
                    ? `${mode.iconBg} text-white`
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-xs truncate tracking-tight">
                {mode.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Answer Length Control if onSelectAnswerLength provided */}
      {onSelectAnswerLength && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Length:
            </span>
            <span className="text-[10px] text-slate-400">
              (User request overrides)
            </span>
          </div>

          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200/80">
            {LENGTH_OPTIONS.map((opt) => {
              const isChosen = answerLength === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`length-btn-${opt.id}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectAnswerLength(opt.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                    isChosen
                      ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
