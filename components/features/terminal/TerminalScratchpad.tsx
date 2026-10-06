'use client';

import { useState, useEffect } from 'react';
import { Terminal, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface TerminalScratchpadProps {
  onConvertToTask: (text: string) => Promise<void>;
}

const SCRATCHPAD_KEY = 'terminal:scratchpad:v1';

export default function TerminalScratchpad({ onConvertToTask }: TerminalScratchpadProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(SCRATCHPAD_KEY);
    if (saved) setContent(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCRATCHPAD_KEY, val);
    }
  };

  const handleClear = () => {
    if (!content.trim()) return;
    if (window.confirm('Scratchpad wirklich leeren?')) {
      setContent('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SCRATCHPAD_KEY);
      }
      toast.success('Scratchpad geleert');
    }
  };

  const handleConvertFirstLine = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const firstLine = trimmed.split('\n')[0]?.trim();
    if (!firstLine) return;

    setIsConverting(true);
    try {
      await onConvertToTask(firstLine);
      // Remove first line from content
      const remaining = trimmed.split('\n').slice(1).join('\n');
      setContent(remaining);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SCRATCHPAD_KEY, remaining);
      }
      toast.success(`Aufgabe erfasst: „${firstLine}“`);
    } catch {
      toast.error('Fehler beim Erfassen');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0D1017]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-3 bg-white/[0.015] border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.035] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-semibold text-white tracking-wider uppercase">
            Quick Capture & Scratchpad
          </span>
          {content.trim() && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Notiz aktiv
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {content.trim() && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertFirstLine();
              }}
              disabled={isConverting}
              className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/40 transition-all duration-150 shadow-sm"
            >
              <Plus className="w-3 h-3" />
              Erste Zeile als Task
            </button>
          )}

          <div className="p-1 rounded-md text-white/40 hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Area */}
      {isExpanded && (
        <div className="p-4 space-y-2.5 animate-in fade-in duration-150 bg-black/20">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="// Spontane Gedanken, Startup-Ideen, Notizen, Zwischenschritte eintragen... (Autosaved)"
            rows={4}
            className="w-full text-xs font-mono bg-[#07090E] border border-white/[0.08] rounded-xl p-3.5 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 leading-relaxed resize-y scrollbar-thin"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 px-1 pt-0.5">
            <span className="tabular-nums">
              {content.trim().split(/\s+/).filter(Boolean).length} Wörter • {content.length} Zeichen
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-rose-400 transition-colors"
              >
                Leeren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
