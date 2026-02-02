'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

async function saveNote(content: string, date: string): Promise<void> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, content }),
  });
  if (!response.ok) throw new Error('Failed to save note');
}

export default function QuickNotes() {
  const today = new Date().toISOString().split('T')[0];
  const [content, setContent] = useState('');

  const saveMutation = useMutation({
    mutationFn: (note: string) => saveNote(note, today),
    onSuccess: () => {
      // Auto-save feedback could be shown here
    },
  });

  const handleChange = (value: string) => {
    setContent(value);
    // Auto-save with debounce (simple version - save on blur or after 2 seconds of no typing)
    clearTimeout((window as any).noteSaveTimer);
    (window as any).noteSaveTimer = setTimeout(() => {
      if (value.trim()) {
        saveMutation.mutate(value.trim());
      }
    }, 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-gray-900 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700 shadow-lg p-3 z-50">
      <label className="text-xs text-gray-400 dark:text-gray-400 mb-1 block">
        💭 Quick thought...
      </label>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (content.trim()) {
            saveMutation.mutate(content.trim());
          }
        }}
        placeholder="Jot down a quick note..."
        className="w-full px-2 py-1.5 text-xs bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 rounded resize-none"
        rows={3}
      />
      {saveMutation.isPending && (
        <div className="text-[10px] text-gray-500 mt-1">Saving...</div>
      )}
    </div>
  );
}
