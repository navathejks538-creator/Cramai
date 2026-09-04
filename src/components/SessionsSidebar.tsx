import React, { useState } from 'react';
import { StudySession } from '../types';
import {
  X,
  Plus,
  Trash2,
  Download,
  Clock,
  Layers,
  Search,
  MessageSquare
} from 'lucide-react';
import { STUDY_MODES } from './ModeSelector';

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudySession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (session: StudySession) => void;
}

export const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onExportSession
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="sessions-sidebar-backdrop"
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex justify-start animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="sessions-sidebar-drawer"
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-50 border-r border-slate-200 animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Study History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Session Button */}
        <div className="p-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Topic</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search previous topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs">No study sessions found</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const mode = STUDY_MODES.find((m) => m.id === session.mode);
              const ModeIcon = mode ? mode.icon : Layers;

              return (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ModeIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                        {mode?.shortName || 'Study'}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {new Date(session.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {session.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-1">
                      {session.messages.length} messages
                    </p>
                  </div>

                  {/* Actions (Export, Delete) */}
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100/80">
                    <button
                      type="button"
                      onClick={() => onExportSession(session)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Export as Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Cram AI • Local & Cloud Synced
        </div>
      </div>
    </div>
  );
};
