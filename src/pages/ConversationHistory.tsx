import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import { EmptyState, GlassCard, PillButton } from '../components/ui/Primitives';
import { formatDuration, formatTimeAgo } from '../lib/format';
import { containsUrduScript } from '../lib/rtl';
import { useToast } from '../context/ToastContext';

type HistoryFilter = 'all' | 'today' | 'week' | 'laptop_actions' | 'urdu';

export default function ConversationHistory() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { sessions, messagesBySession, deleteSession, openConfirmModal } = useZara();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => {
      if (filter === 'today') {
        const d = new Date(s.started_at);
        const today = new Date();
        if (d.toDateString() !== today.toDateString()) return false;
      } else if (filter === 'week') {
        if (now - new Date(s.started_at).getTime() > 7 * 86400_000) return false;
      } else if (filter === 'laptop_actions' && !s.has_laptop_actions) {
        return false;
      } else if (filter === 'urdu' && s.language === 'english') {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          (s.summary ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, filter, search]);

  const activeSession = useMemo(() => {
    if (sessionId) return sessions.find((s) => s.id === sessionId) ?? null;
    return filteredSessions[0] ?? null;
  }, [sessionId, sessions, filteredSessions]);

  const activeMessages = useMemo(
    () => (activeSession ? messagesBySession[activeSession.id] ?? [] : []),
    [activeSession, messagesBySession]
  );

  const exportTxt = () => {
    if (!activeSession) return;
    const lines = [
      `Session: ${activeSession.title}`,
      `Started: ${activeSession.started_at}`,
      '',
      ...activeMessages.map(
        (m) => `[${m.role.toUpperCase()}] ${m.content_text}${m.content_en ? ` (${m.content_en})` : ''}`
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zara-session-${activeSession.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transcript exported as TXT.', 'success');
  };

  return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Conversation History
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Search bilingual dialogues, replay context, or export transcripts.
            </p>
          </div>
          <Link to="/talk" className="btn-primary-glow px-5 py-2.5 rounded-full text-label-md inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">mic</span>
            New Conversation
          </Link>
        </div>

        {/* Search & Filter Chips */}
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[20px]">
              search
            </span>
            <input
              type="text"
              aria-label="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, summaries, or topics..."
              className="zara-input w-full pl-11 pr-4 py-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All Logs'],
                ['today', 'Today'],
                ['week', 'This Week'],
                ['laptop_actions', 'Laptop Actions Only'],
                ['urdu', 'Urdu Transcripts'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-label-sm font-medium transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            icon="forum"
            title="No memories yet. Say hello to Zara."
            subtitle="Once you speak or chat with Zara on the Live Voice page, sessions will appear here."
            actionLabel="Start Talking"
            onAction={() => navigate('/talk')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Session List */}
            <div className="lg:col-span-4 space-y-3">
              {filteredSessions.length === 0 ? (
                <GlassCard className="p-6 text-center text-body-sm text-on-surface-variant">
                  No conversations match this filter.
                </GlassCard>
              ) : (
                filteredSessions.map((s) => (
                  <Link
                    key={s.id}
                    to={`/history/${s.id}`}
                    className={`block rounded-[20px] p-4 transition-all ${
                      activeSession?.id === s.id
                        ? 'glass-elevated border-primary/50'
                        : 'glass-panel hover:border-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-label-md text-on-surface font-semibold truncate">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant shrink-0">
                        {formatTimeAgo(s.started_at)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {s.summary || 'No summary recorded yet.'}
                    </p>
                  </Link>
                ))
              )}
            </div>

            {/* Detail Pane */}
            <div className="lg:col-span-8">
              {!activeSession ? (
                <EmptyState
                  icon="chat"
                  title="Select a conversation"
                  subtitle="Choose a session from the list to read its transcript."
                />
              ) : (
                <GlassCard className="p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border-subtle/40">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface">
                        {activeSession.title}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Duration: {formatDuration(activeSession.duration_seconds)} • Language:{' '}
                        {activeSession.language}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PillButton
                        variant="primary"
                        onClick={() =>
                          navigate('/talk', {
                            state: { continueSummary: activeSession.summary || activeSession.title },
                          })
                        }
                      >
                        Continue this chat
                      </PillButton>
                      <PillButton variant="secondary" onClick={exportTxt}>
                        Export TXT
                      </PillButton>
                      <PillButton
                        variant="danger"
                        onClick={() =>
                          openConfirmModal({
                            title: 'Delete Conversation?',
                            description: `Permanently delete "${activeSession.title}" from history?`,
                            method: 'manual',
                            riskLevel: 'medium',
                            onConfirm: () => deleteSession(activeSession.id),
                          })
                        }
                      >
                        Delete
                      </PillButton>
                    </div>
                  </div>

                  {activeMessages.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant py-6 text-center">
                      No messages recorded in this session yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activeMessages.map((m) => {
                        const isUrdu = containsUrduScript(m.content_text);
                        return (
                          <div
                            key={m.id}
                            className={`p-4 rounded-2xl ${
                              m.role === 'user'
                                ? 'bg-secondary-container/25 border border-secondary/30 ml-6'
                                : 'bg-surface-container-high/80 border border-primary/20 mr-6'
                            }`}
                          >
                            <div className="text-[11px] text-on-surface-variant mb-1 uppercase">
                              {m.role}
                            </div>
                            <p
                              className={
                                isUrdu
                                  ? 'urdu-rtl text-urdu-body text-primary-fixed text-right'
                                  : 'text-body-sm text-on-surface'
                              }
                              dir={isUrdu ? 'rtl' : 'ltr'}
                              lang={isUrdu ? 'ur' : 'en'}
                            >
                              {m.content_text}
                            </p>
                            {m.content_en && (
                              <p className="text-xs text-secondary mt-1">{m.content_en}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
