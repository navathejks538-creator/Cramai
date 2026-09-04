import { useState, useEffect, useRef } from 'react';
import {
  StudyMode,
  StudyAttachment,
  ChatMessage,
  StudySession,
  AnalyzeResponse
} from './types';
import { Header } from './components/Header';
import { StudyConsole } from './components/StudyConsole';
import { MessageItem } from './components/MessageItem';
import { StudyInputBar } from './components/StudyInputBar';
import { ModeSelector, getModeConfig } from './components/ModeSelector';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { SessionsSidebar } from './components/SessionsSidebar';
import { Loader2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'cram_ai_study_sessions_v1';

function normalizeMode(mode?: string): StudyMode {
  if (mode === 'step_by_step') return 'step_solver';
  if (mode === 'deep_dive') return 'deep_concept';
  if (mode === 'simple' || mode === 'step_solver' || mode === 'deep_concept' || mode === 'high_yield' || mode === 'socratic' || mode === 'exam_traps') {
    return mode;
  }
  return 'simple';
}

export default function App() {
  // Saved sessions state
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading sessions from storage:', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Current session active message list
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  // Active mode state - defaults strictly to 'simple'
  const [currentMode, setCurrentMode] = useState<StudyMode>(() => {
    return activeSession ? normalizeMode(activeSession.mode) : 'simple';
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<StudyAttachment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Auto scroll ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Persist sessions to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error persisting sessions to storage:', e);
    }
  }, [sessions]);

  // Sync mode when switching sessions
  useEffect(() => {
    if (activeSession) {
      setCurrentMode(normalizeMode(activeSession.mode));
    }
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isAnalyzing]);

  // Mode Selection Handler: updates immediately without calling Gemini or page reload
  const handleSelectMode = (newMode: StudyMode) => {
    setCurrentMode(newMode);
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, mode: newMode, updatedAt: Date.now() } : s))
      );
    }
  };

  // Session Management Handlers
  const handleCreateNewSession = () => {
    setActiveSessionId(null);
    setInputPrompt('');
    setAttachments([]);
    setApiError(null);
    setCurrentMode('simple');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setApiError(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleClearCurrentSession = () => {
    if (!activeSessionId) return;
    if (confirm('Clear messages in this study session?')) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s))
      );
    }
  };

  const handleExportSession = (session: StudySession) => {
    const title = session.title || 'Cram AI Study Notes';
    let markdown = `# ${title}\n`;
    markdown += `**Date**: ${new Date(session.createdAt).toLocaleDateString()}\n`;
    markdown += `**Mode**: ${session.mode}\n\n---\n\n`;

    session.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? '### Student' : '### Cram AI';
      markdown += `${sender} (${new Date(msg.timestamp).toLocaleTimeString()}):\n\n`;
      if (msg.attachments && msg.attachments.length > 0) {
        markdown += `*Attached: ${msg.attachments.map((a) => a.name).join(', ')}*\n\n`;
      }
      markdown += `${msg.content}\n\n`;
      if (msg.keyTakeaways && msg.keyTakeaways.length > 0) {
        markdown += `**Key Takeaways:**\n`;
        msg.keyTakeaways.forEach((k) => (markdown += `- ${k}\n`));
        markdown += `\n`;
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Attachment handlers
  const handleAddAttachments = (newAtts: StudyAttachment[]) => {
    setAttachments((prev) => [...prev, ...newAtts]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCameraCapture = (attachment: StudyAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handlePreviewImage = (url: string, name: string) => {
    setPreviewImage({ url, name });
  };

  // Main Submit & Analysis Flow
  const handleSubmit = async (
    overridePrompt?: string,
    overrideMode?: StudyMode,
    overrideAttachments?: StudyAttachment[]
  ) => {
    const textToSend = overridePrompt !== undefined ? overridePrompt : inputPrompt;
    const queuedAttachments = overrideAttachments !== undefined ? overrideAttachments : [...attachments];
    const modeToUse = overrideMode || currentMode;

    if (!textToSend.trim() && queuedAttachments.length === 0) return;

    setApiError(null);
    setIsAnalyzing(true);

    const promptText = textToSend.trim();

    // Clear inputs immediately for responsive UX
    if (overridePrompt === undefined) {
      setInputPrompt('');
    }
    if (overrideAttachments === undefined) {
      setAttachments([]);
    }

    // Construct user message
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptText || 'Please analyze the attached study material.',
      timestamp: Date.now(),
      mode: modeToUse,
      attachments: queuedAttachments.length > 0 ? queuedAttachments : undefined
    };

    let targetSessionId = activeSessionId;
    let currentSessionMessages: ChatMessage[] = [];

    // If no active session, create one
    if (!targetSessionId) {
      const newSessionId = `session_${Date.now()}`;
      targetSessionId = newSessionId;
      const initialTitle = promptText
        ? promptText.slice(0, 48) + (promptText.length > 48 ? '...' : '')
        : queuedAttachments[0]?.name || 'Study Session';

      const newSession: StudySession = {
        id: newSessionId,
        title: initialTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode: modeToUse,
        messages: [userMessage]
      };

      currentSessionMessages = [userMessage];
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSessionId);
    } else {
      // Append to active session
      currentSessionMessages = [...messages, userMessage];
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, mode: modeToUse, messages: [...s.messages, userMessage], updatedAt: Date.now() }
            : s
        )
      );
    }

    try {
      // Prepare history for context-aware conversation (exclude the latest user message as it's sent in prompt/attachments)
      const priorHistory = currentSessionMessages.slice(0, -1).map((m) => ({
        role: m.role,
        text: m.content
      }));

      // Call Express server API
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mode: modeToUse,
          attachments: queuedAttachments.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            data: a.data
          })),
          history: priorHistory
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error: ${res.statusText}`);
      }

      const data: AnalyzeResponse = await res.json();

      const modelMessage: ChatMessage = {
        id: `msg_model_${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        mode: modeToUse,
        keyTakeaways: data.keyTakeaways,
        suggestedFollowUps: data.suggestedFollowUps
      };

      // Append model response to session
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, mode: modeToUse, messages: [...s.messages, modelMessage], updatedAt: Date.now() }
            : s
        )
      );
    } catch (err: unknown) {
      console.error('Study analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with AI server.';
      setApiError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUpClick = (followUpPrompt: string) => {
    handleSubmit(followUpPrompt);
  };

  const handleRegenerateInMode = (_prevContent: string, targetMode: StudyMode) => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    setCurrentMode(targetMode);
    handleSubmit(lastUserMsg.content, targetMode, lastUserMsg.attachments);
  };

  const currentModeConfig = getModeConfig(currentMode);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <Header
        currentMode={currentMode}
        sessionCount={sessions.length}
        hasActiveMessages={messages.length > 0}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewSession={handleCreateNewSession}
        onClearSession={handleClearCurrentSession}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto px-2 sm:px-4">
        {/* Error Notification Banner */}
        {apiError && (
          <div className="my-3 mx-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs shadow-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Study Helper Error</p>
              <p className="text-rose-800">{apiError}</p>
            </div>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-1.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          /* Empty state / Welcome console */
          <StudyConsole
            currentMode={currentMode}
            onSelectMode={handleSelectMode}
            inputPrompt={inputPrompt}
            setInputPrompt={setInputPrompt}
            attachments={attachments}
            onAddAttachments={handleAddAttachments}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenCamera={() => setIsCameraOpen(true)}
            onPreviewImage={handlePreviewImage}
            onSubmit={() => handleSubmit()}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          /* Active Study Discussion Thread */
          <div className="flex-1 py-4 sm:py-6 px-2 sm:px-4">
            {/* Mode selector within active session */}
            <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
              <ModeSelector
                currentMode={currentMode}
                onSelectMode={handleSelectMode}
                disabled={isAnalyzing}
              />
            </div>

            {/* Conversation Messages */}
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onPreviewImage={handlePreviewImage}
                  onSelectFollowUp={handleFollowUpClick}
                  onRegenerateInMode={handleRegenerateInMode}
                  currentMode={currentMode}
                  isLatestModelMessage={msg.role === 'model' && index === messages.length - 1}
                />
              ))}

              {/* Loading indicator during generation */}
              {isAnalyzing && (
                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl max-w-md animate-pulse">
                  <div className={`w-8 h-8 rounded-full ${currentModeConfig.iconBg} flex items-center justify-center text-white`}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Cram AI is generating [{currentModeConfig.name}] response...
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {currentModeConfig.tagline}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Input Bar (shown in active conversation) */}
      {messages.length > 0 && (
        <StudyInputBar
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          onSubmit={() => handleSubmit()}
          isAnalyzing={isAnalyzing}
          attachments={attachments}
          onAddAttachments={handleAddAttachments}
          onRemoveAttachment={handleRemoveAttachment}
          onOpenCamera={() => setIsCameraOpen(true)}
          onPreviewImage={handlePreviewImage}
          currentMode={currentMode}
        />
      )}

      {/* Modals & Drawers */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        imageName={previewImage?.name || ''}
      />

      <SessionsSidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
        onExportSession={handleExportSession}
      />
    </div>
  );
}

