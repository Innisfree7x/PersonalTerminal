'use client';

import { useState } from 'react';
import { Mail, Plus, ExternalLink, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { GmailMessageSummary } from '@/lib/google/gmail';

interface GmailTriagePanelProps {
  messages: GmailMessageSummary[];
  connected: boolean;
  isLoading: boolean;
  error?: string | undefined;
  onRefresh: () => void;
  onConvertToTask: (email: GmailMessageSummary) => Promise<void>;
}

export default function GmailTriagePanel({
  messages,
  connected,
  isLoading,
  error,
  onRefresh,
  onConvertToTask,
}: GmailTriagePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());

  const handleConvert = async (msg: GmailMessageSummary) => {
    setConvertingId(msg.id);
    try {
      await onConvertToTask(msg);
      setConvertedIds((prev) => new Set(prev).add(msg.id));
    } catch (err) {
      console.error('Failed to convert email to task:', err);
    } finally {
      setConvertingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold tracking-wider text-white uppercase font-mono">
            Inbox & E-Mail Triage
          </h2>
          {connected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-mono border border-rose-500/20 tabular-nums">
              {messages.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {connected && (
            <button
              onClick={onRefresh}
              title="Mails neu laden"
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            title="In Gmail öffnen"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[460px] scrollbar-thin">
        {!connected ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-white tracking-tight">Gmail nicht verknüpft</h3>
              <p className="text-[11px] text-white/50 max-w-xs font-sans leading-relaxed">
                Verknüpfe dein Google-Konto, um wichtige Mails direkt im Terminal zu sehen und mit einem
                Klick in Aufgaben zu verwandeln.
              </p>
            </div>
            <a
              href="/api/auth/google"
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition-all shadow-md shadow-rose-500/20"
            >
              Google Workspace verbinden
            </a>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs font-mono space-y-2">
            <p>{error}</p>
            <a
              href="/api/auth/google"
              className="inline-block text-[11px] underline font-medium hover:text-white"
            >
              Berechtigung erneuern
            </a>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 space-y-2">
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />
            </div>
            <p className="text-xs font-mono">Posteingang aufgeräumt – Inbox Zero erreicht.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const isConverted = convertedIds.has(msg.id);
            const isConverting = convertingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`group rounded-xl border transition-all duration-150 ${
                  msg.isUnread
                    ? 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.045]'
                    : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09] hover:bg-white/[0.025]'
                }`}
              >
                <div className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    >
                      <div className="flex items-center gap-2">
                        {msg.isUnread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"
                            style={{ boxShadow: '0 0 6px rgba(244, 63, 94, 0.7)' }}
                          />
                        )}
                        <h4 className="text-xs font-medium text-white truncate tracking-tight">{msg.subject}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-0.5">
                        <span className="truncate max-w-[150px]">{msg.from}</span>
                        <span>•</span>
                        <span className="tabular-nums">{formatDate(msg.date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isConverted ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Erfasst
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvert(msg)}
                          disabled={isConverting}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-medium rounded-lg bg-white/[0.04] hover:bg-cyan-500/15 text-white/70 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-150 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          {isConverting ? '...' : '+ Task'}
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                        className="p-1 rounded-md text-white/30 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Snippet preview */}
                  {isExpanded && (
                    <div className="pt-2.5 border-t border-white/[0.05] text-[11px] text-white/60 leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                      {msg.snippet || 'Keine Vorschau verfügbar.'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
