'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Mail,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface TerminalStatusBarProps {
  tasksCount: number;
  tasksCompleted: number;
  eventsCount: number;
  unreadEmailsCount: number;
  googleConnected: boolean;
  onRefresh?: (() => void) | undefined;
  onQuickTask?: (() => void) | undefined;
  onQuickEvent?: (() => void) | undefined;
}

export default function TerminalStatusBar({
  tasksCount,
  tasksCompleted,
  eventsCount,
  unreadEmailsCount,
  googleConnected,
  onRefresh,
  onQuickTask,
  onQuickEvent,
}: TerminalStatusBarProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* Top subtle ambient highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: System Title & Live Clock */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
              TERMINAL LIVE
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          <div className="flex items-center gap-2 text-xs font-mono text-white/80">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span className="font-semibold text-white tracking-wide">{timeStr}</span>
            <span className="text-white/30">|</span>
            <span className="text-white/60">{dateStr}</span>
          </div>
        </div>

        {/* Center: System Status Indicators */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Google Sync Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono transition-all ${
              googleConnected
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span className="font-medium">
              Google Workspace: {googleConnected ? 'Synchronisiert' : 'Nicht verknüpft'}
            </span>
            {!googleConnected && (
              <a
                href="/api/auth/google"
                className="ml-1 underline font-semibold hover:text-white"
              >
                Verbinden
              </a>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-2 text-white/60 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span className="text-white font-medium">{tasksCompleted}</span>/{tasksCount} Tasks
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] shadow-sm">
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span className="text-white font-medium">{eventsCount}</span> Termine
            </span>
            {googleConnected && (
              <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] shadow-sm">
                <Mail className="w-3 h-3 text-rose-400" />
                <span className="text-white font-medium">{unreadEmailsCount}</span> Mails
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Command Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onQuickTask) onQuickTask();
              else window.dispatchEvent(new CustomEvent('terminal:quick-capture:open', { detail: { mode: 'task' } }));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-white/90 border border-white/[0.08] hover:border-white/[0.16] text-xs font-mono font-medium transition-all duration-150 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Erfassen</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-white/50 border border-white/[0.08]">C</kbd>
          </button>

          <button
            onClick={() => {
              if (onQuickEvent) onQuickEvent();
              else window.dispatchEvent(new CustomEvent('terminal:quick-capture:open', { detail: { mode: 'calendar' } }));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-white/90 border border-white/[0.08] hover:border-white/[0.16] text-xs font-mono font-medium transition-all duration-150 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time-Block</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-white/50 border border-white/[0.08]">T</kbd>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Terminal & Google Sync aktualisieren"
              className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white transition-all border border-white/[0.06] hover:border-white/[0.12]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
