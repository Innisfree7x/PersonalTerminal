'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

async function saveNote(content: string, date: string): Promise<void> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, content }),
  });
  if (!response.ok) throw new Error('Failed to save note');
}

// Extend Window interface to include our custom property
declare global {
  interface Window {
    noteSaveTimer?: ReturnType<typeof setTimeout>;
  }
}

export default function QuickNotes() {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (note: string) => saveNote(note, today),
    onSuccess: () => {
      // Auto-save feedback could be shown here
    },
  });

  const handleChange = (value: string) => {
    setContent(value);
    // Auto-save with debounce
    if (window.noteSaveTimer) {
      clearTimeout(window.noteSaveTimer);
    }
    window.noteSaveTimer = setTimeout(() => {
      if (value.trim()) {
        saveMutation.mutate(value.trim());
      }
    }, 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded ? (
          // Expanded state - Full textarea
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-80 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-4"
            onMouseLeave={() => setIsExpanded(false)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-text-primary">💭 Quick Note</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => {
                if (content.trim()) {
                  saveMutation.mutate(content.trim());
                }
              }}
              placeholder="Jot down a quick note..."
              className="w-full px-3 py-2 text-sm bg-surface-hover text-text-primary border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={4}
              autoFocus
            />
            
            {saveMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-text-tertiary mt-2"
              >
                Saving...
              </motion.div>
            )}
          </motion.div>
        ) : (
          // Collapsed state - Floating button
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onMouseEnter={() => setIsExpanded(true)}
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center justify-center w-14 h-14 bg-primary hover:bg-primary-hover rounded-full shadow-lg shadow-primary/30 transition-all"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-6 h-6 text-white" />
            
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 px-3 py-1 bg-surface border border-border rounded-lg text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              Quick Note
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
