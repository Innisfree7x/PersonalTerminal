'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Mail,
  RefreshCw,
  ExternalLink,
  Plus,
  CheckCircle2,
  Calendar,
  Search,
  Check,
  Clock,
} from 'lucide-react';
import type { GmailMessageSummary } from '@/lib/google/gmail';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [convertedTasks, setConvertedTasks] = useState<Set<string>>(new Set());
  const [blockedEvents, setBlockedEvents] = useState<Set<string>>(new Set());

  // 1. Fetch Gmail Messages
  const {
    data: gmailData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<{ connected: boolean; messages: GmailMessageSummary[]; error?: string }>({
    queryKey: ['workspace', 'inbox'],
    queryFn: async () => {
      const res = await fetch('/api/google/gmail');
      if (!res.ok) throw new Error('Failed to load emails');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const connected = gmailData?.connected ?? false;
  const messages = gmailData?.messages ?? [];

  // Filter & Search
  const filteredMessages = messages.filter((msg) => {
    if (filter === 'unread' && !msg.isUnread) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.subject.toLowerCase().includes(q) ||
        msg.from.toLowerCase().includes(q) ||
        msg.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Convert to Daily Task
  const handleCreateTask = async (msg: GmailMessageSummary) => {
    try {
      const { getLocalDateString } = await import('@/lib/utils/date');
      const todayStr = getLocalDateString();
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Mail: ${msg.subject}`,
          date: todayStr,
          timeEstimate: 15,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setConvertedTasks((prev) => new Set(prev).add(msg.id));
      toast.success('Als Aufgabe für heute erfasst!');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'tasks'] });
    } catch {
      toast.error('Fehler beim Erfassen der Aufgabe');
    }
  };

  // Action: Time-block in Google Calendar
  const handleTimeBlock = async (msg: GmailMessageSummary) => {
    try {
      const now = new Date();
      const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
      const in60Min = new Date(now.getTime() + 60 * 60 * 1000);

      const res = await fetch('/api/calendar/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Email Follow-up: ${msg.subject}`,
          description: `Von: ${msg.from}\n\n${msg.snippet}`,
          startsAt: in30Min.toISOString(),
          endsAt: in60Min.toISOString(),
          syncWithGoogle: true,
          kind: 'custom',
        }),
      });
      if (!res.ok) throw new Error('Failed to schedule event');
      setBlockedEvents((prev) => new Set(prev).add(msg.id));
      toast.success('In Google Kalender für heute geblockt!');
      await queryClient.invalidateQueries({ queryKey: ['terminal', 'calendar'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-entries'] });
    } catch {
      toast.error('Fehler beim Blocken im Kalender');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              INBOX & E-MAIL TRIAGE
            </h1>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono tracking-wider uppercase ${
                connected
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}
            >
              {connected ? 'Gmail Synchronisiert' : 'Getrennt'}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 font-sans">
            Wichtige Nachrichten in Sekunden sichten und direkt in Kalender-Blöcke oder Aufgaben überführen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={() => {
                refetch();
                toast.success('Posteingang aktualisiert');
              }}
              disabled={isRefetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-mono font-medium transition-all duration-150 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Neu laden
            </button>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-mono font-semibold shadow-md shadow-rose-500/20 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              Google Workspace verbinden
            </a>
          )}

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs font-mono transition-all duration-150 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            In Gmail öffnen
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all duration-150 ${
              filter === 'unread'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Ungelesen ({messages.filter((m) => m.isUnread).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all duration-150 ${
              filter === 'all'
                ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Alle ({messages.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mails durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono bg-black/40 border border-white/[0.1] rounded-xl pl-9 pr-3.5 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/20"
          />
        </div>
      </div>

      {/* Main Split Layout: List & Detail Preview */}
      {!connected ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl p-8 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)]">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-base font-bold text-white font-mono tracking-tight">Gmail nicht verknüpft</h2>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Verbinde dein Google-Konto mit 2 Klicks, um deine E-Mails direkt in der Kommandozentrale
              einzusehen, ohne deinen Arbeitsfokus im Browser-Tab zu verlieren.
            </p>
          </div>
          <a
            href="/api/auth/google"
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono font-semibold text-xs transition-all shadow-lg shadow-rose-500/20"
          >
            Google Workspace jetzt verbinden
          </a>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl p-6 space-y-2 text-white/40">
          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
          </div>
          <p className="text-xs font-mono">Keine E-Mails im gewählten Filter – alles erledigt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Email Cards List (7 Cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            {filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              const hasTask = convertedTasks.has(msg.id);
              const hasBlock = blockedEvents.has(msg.id);

              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_-4px_rgba(244,63,94,0.15)]'
                      : msg.isUnread
                      ? 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                      : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {msg.isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0"
                            style={{ boxShadow: '0 0 6px rgba(244, 63, 94, 0.7)' }}
                          />
                        )}
                        <span className="text-xs font-semibold text-white truncate max-w-[200px] tracking-tight">
                          {msg.from}
                        </span>
                        <span className="text-[10px] font-mono text-white/30">•</span>
                        <span className="text-[10px] font-mono text-white/40 tabular-nums">
                          {formatDate(msg.date)}
                        </span>
                      </div>

                      <h3 className="text-xs font-medium text-white/90 truncate mt-1 tracking-tight">
                        {msg.subject}
                      </h3>

                      <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-relaxed font-sans">
                        {msg.snippet || 'Keine Textvorschau verfügbar.'}
                      </p>
                    </div>

                    {/* Quick Badge / Status */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {hasTask && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          <Check className="w-2.5 h-2.5" /> Task
                        </span>
                      )}
                      {hasBlock && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          <Calendar className="w-2.5 h-2.5" /> Kalender
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail & Action Inspector (5 Cols) */}
          <div className="lg:col-span-5 sticky top-20">
            {selectedMessage ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl p-5 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-rose-400 tracking-wider font-semibold">
                      E-Mail Detail
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1 leading-snug tracking-tight">
                      {selectedMessage.subject}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 truncate">Von: {selectedMessage.from}</p>
                    <p className="text-[10px] font-mono text-white/40 tabular-nums">
                      {formatDate(selectedMessage.date)}
                    </p>
                  </div>
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${selectedMessage.threadId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="In Gmail öffnen"
                    className="p-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Email Body Snippet */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Vorschau</span>
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/40 text-xs text-white/80 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto scrollbar-thin">
                    {selectedMessage.snippet}
                  </div>
                </div>

                {/* Direct Action Bridge */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    Kommando-Aktionen
                  </span>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleCreateTask(selectedMessage)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      In Fokus-Aufgaben für heute erfassen
                    </button>

                    <button
                      onClick={() => handleTimeBlock(selectedMessage)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-medium transition-all shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Heute in Google Kalender blocken (30 Min)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 text-white/30 space-y-2">
                <Mail className="w-6 h-6 opacity-30" />
                <p className="text-xs font-mono">Wähle links eine E-Mail aus, um Aktionen durchzuführen.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
