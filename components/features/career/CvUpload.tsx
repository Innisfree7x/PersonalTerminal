'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browserClient';

type ExtractResponse = { text: string };

const MAX_BYTES = 4 * 1024 * 1024;
const STORAGE_BUCKET = 'cv-uploads';
const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);
const ACCEPTED_EXT = new Set(['pdf', 'docx']);

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function getFileExt(file: File): string {
  const segments = file.name.toLowerCase().split('.');
  return segments.length > 1 ? (segments[segments.length - 1] ?? '') : '';
}

function isAllowedFile(file: File): { ok: boolean; reason?: string } {
  const ext = getFileExt(file);
  const hasValidMime = !file.type || ACCEPTED_MIME.has(file.type);
  const hasValidExt = ACCEPTED_EXT.has(ext);
  if (!hasValidMime && !hasValidExt) {
    return { ok: false, reason: 'Only PDF or DOCX files are allowed.' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: `Max file size is 4MB (got ${formatBytes(file.size)}).` };
  }
  return { ok: true };
}

interface CvUploadProps {
  externalFile?: File | null;
  externalFileNonce?: number;
}

export default function CvUpload({ externalFile = null, externalFileNonce = 0 }: CvUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastHandledExternalNonceRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const canUseSupabase = useMemo(() => !!supabaseBrowser, []);

  const pickFile = () => inputRef.current?.click();

  const handleFile = useCallback(async (file: File): Promise<void> => {
    setError(null);
    setUploadWarning(null);
    setProgress(0);

    const allowed = isAllowedFile(file);
    if (!allowed.ok) {
      setError(allowed.reason ?? 'Invalid file.');
      return;
    }

    setIsUploading(true);
    try {
      // 1) Extract text first so the main function works even when storage is unavailable.
      setProgress(10);
      const ext = getFileExt(file) === 'pdf' ? 'pdf' : 'docx';
      const form = new FormData();
      form.append('file', file);
      form.append('ext', ext);

      const res = await fetch('/api/cv/extract', { method: 'POST', body: form });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Extract failed (${res.status})`);
      }

      const data = (await res.json()) as ExtractResponse;
      setProgress(70);
      setExtractedText(data.text ?? '');

      // 2) Optional storage upload (non-blocking for extraction UX).
      if (supabaseBrowser) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `cv/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

        if (uploadError) {
          setUploadWarning(`CV text extrahiert, aber Storage-Upload fehlgeschlagen: ${uploadError.message}`);
        } else {
          setUploadedPath(path);
        }
      } else {
        setUploadWarning('CV text extrahiert. Supabase-Storage ist lokal nicht initialisiert.');
      }

      setProgress(100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'CV konnte nicht verarbeitet werden. Bitte erneut versuchen.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  useEffect(() => {
    if (!externalFile || externalFileNonce <= 0) return;
    if (lastHandledExternalNonceRef.current === externalFileNonce) return;
    lastHandledExternalNonceRef.current = externalFileNonce;
    void handleFile(externalFile);
  }, [externalFile, externalFileNonce, handleFile]);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  return (
    <div className="space-y-6">
      {!canUseSupabase ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
          Supabase env not detected in the browser. Ensure you have
          <code className="mx-1 rounded bg-yellow-100 px-1 py-0.5 dark:bg-yellow-900/40">
            bloomberg-personal/.env.local
          </code>
          and restart <code className="mx-1 rounded bg-yellow-100 px-1 py-0.5 dark:bg-yellow-900/40">npm run dev</code>.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {uploadWarning ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
          {uploadWarning}
        </div>
      ) : null}

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        className={[
          'rounded-xl border border-dashed p-8 transition-colors',
          'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700',
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : '',
        ].join(' ')}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="text-3xl">📄</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upload your CV
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Drag & drop a <b>PDF</b> or <b>DOCX</b> (max 4MB), or click to select.
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <button
            type="button"
            onClick={pickFile}
            disabled={isUploading}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading…' : 'Select file'}
          </button>

          {isUploading ? (
            <div className="w-full mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {uploadedPath ? (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Uploaded to <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-900/40">{uploadedPath}</code>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Extracted text (editable)
        </label>
        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Upload a CV to extract text…"
        />
      </div>
    </div>
  );
}
