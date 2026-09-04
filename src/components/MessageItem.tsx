import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  ChatMessage,
  StudyAttachment,
  StudyMode
} from '../types';
import {
  User,
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  ZoomIn,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RotateCw
} from 'lucide-react';
import { speakText, stopSpeech } from '../utils/speech';
import { getModeConfig } from './ModeSelector';
import { formatMathInMarkdown } from '../utils/mathFormatter';

interface MessageItemProps {
  message: ChatMessage;
  onPreviewImage: (url: string, name: string) => void;
  onSelectFollowUp?: (prompt: string) => void;
  onRegenerateInMode?: (prompt: string, mode: StudyMode) => void;
  currentMode?: StudyMode;
  isLatestModelMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onPreviewImage,
  onSelectFollowUp,
  onRegenerateInMode,
  currentMode,
  isLatestModelMessage
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTakeaways, setShowTakeaways] = useState(true);

  // Determine which mode generated this message
  const modeConfig = getModeConfig(message.mode || 'simple');

  // Preprocess math notation so raw \frac, \text, \cdot, etc. render via KaTeX
  const processedMarkdown = useMemo(() => {
    return formatMathInMarkdown(message.content);
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      const started = speakText(message.content, {
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
      if (started) {
        setIsPlayingAudio(true);
      }
    }
  };

  if (isUser) {
    return (
      <div
        id={`chat-msg-${message.id}`}
        className="flex gap-3 justify-end items-start my-4 max-w-4xl ml-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%]">
          {/* Attachments preview if present */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end mb-2">
              {message.attachments.map((att: StudyAttachment) => (
                <div
                  key={att.id}
                  className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center gap-2 max-w-xs group"
                >
                  {att.previewUrl ? (
                    <div
                      className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => onPreviewImage(att.previewUrl!, att.name)}
                    >
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="pr-2 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                      {att.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(att.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User message text */}
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 mr-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Model response
  return (
    <div
      id={`chat-msg-${message.id}`}
      className="flex gap-3 justify-start items-start my-4 max-w-4xl mr-auto animate-in fade-in slide-in-from-bottom-2 duration-200 w-full"
    >
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/30">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs shadow-xs p-4 sm:p-5">
        {/* Header bar with Mode badge and Utilities */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 tracking-tight">Cram AI</span>
            
            {/* Mode badge matching prompt: Cram AI [ Simple ] */}
            <span
              id={`response-mode-${message.id}`}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${modeConfig.activeBg} ${modeConfig.activeBorder} ${modeConfig.activeText}`}
              title={`Answered in ${modeConfig.name} mode: ${modeConfig.tagline}`}
            >
              <modeConfig.icon className="w-3 h-3" />
              <span>[ {modeConfig.name} ]</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Optional regenerate in current active mode if different */}
            {isLatestModelMessage && currentMode && currentMode !== message.mode && onRegenerateInMode && (
              <button
                type="button"
                onClick={() => onRegenerateInMode(message.content, currentMode)}
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 text-xs flex items-center gap-1 transition-colors cursor-pointer mr-1"
                title={`Regenerate in ${getModeConfig(currentMode).name} mode`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  Regenerate in {getModeConfig(currentMode).name}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleAudio}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={isPlayingAudio ? 'Stop Speech' : 'Listen Aloud'}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                  <span className="text-[11px] hidden sm:inline">Playing</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Listen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-medium hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* High-Yield Study Takeaways Card only if genuinely present */}
        {message.keyTakeaways && message.keyTakeaways.length > 0 && (
          <div className="mb-4 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-950">
            <button
              type="button"
              onClick={() => setShowTakeaways(!showTakeaways)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wide">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>High-Yield Study Takeaways</span>
              </div>
              {showTakeaways ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
              )}
            </button>

            {showTakeaways && (
              <ul className="mt-2 space-y-1.5 text-xs text-amber-900/90 pl-1">
                {message.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Main Markdown Body with KaTeX Math rendering */}
        <div className="markdown-body prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1 [&>p]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-2 [&>li]:my-0.5 [&>pre]:bg-slate-900 [&>pre]:text-slate-100 [&>pre]:p-3 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>code]:bg-slate-100 [&>code]:text-indigo-700 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono [&>code]:text-xs [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table_th]:border [&>table_th]:border-slate-200 [&>table_th]:bg-slate-50 [&>table_th]:px-2.5 [&>table_th]:py-1.5 [&>table_th]:text-xs [&>table_th]:font-semibold [&>table_td]:border [&>table_td]:border-slate-200 [&>table_td]:px-2.5 [&>table_td]:py-1.5 [&>table_td]:text-xs [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-400 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-600">
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {processedMarkdown}
          </Markdown>
        </div>

        {/* Contextual Follow-up Questions only if provided */}
        {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && onSelectFollowUp && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Suggested Follow-ups</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedFollowUps.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectFollowUp(prompt)}
                  className="group flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50/80 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-300 px-3 py-1.5 rounded-full transition-all text-left cursor-pointer"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
