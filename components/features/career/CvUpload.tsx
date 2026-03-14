'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browserClient';
import type { CvAnalyzeResult } from '@/lib/schemas/cv-analysis.schema';

type ExtractResponse = { text: string };
type AnalyzeResponse = {
  analysis: CvAnalyzeResult;
  meta?: {
    persisted?: boolean;
  };
};

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
  const [analysis, setAnalysis] = useState<CvAnalyzeResult | null>(null);
  const [analysisPersisted, setAnalysisPersisted] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const canUseSupabase = useMemo(() => !!supabaseBrowser, []);

  const pickFile = () => inputRef.current?.click();

  const handleFile = useCallback(async (file: File): Promise<void> => {
    setError(null);
    setUploadWarning(null);
    setAnalysisError(null);
    setAnalysis(null);
    setAnalysisPersisted(false);
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
      const nextText = data.text ?? '';
      setExtractedText(nextText);

      // 1.5) Analyze CV text (non-blocking for storage, but part of upload flow value).
      setIsAnalyzing(true);
      setProgress(82);
      try {
        const analyzeResponse = await fetch('/api/cv/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvText: nextText,
            targetTracks: ['M&A', 'TS'],
          }),
        });

        if (!analyzeResponse.ok) {
          const msg = await analyzeResponse.text();
          throw new Error(msg || `Analyze failed (${analyzeResponse.status})`);
        }

        const analyzeData = (await analyzeResponse.json()) as AnalyzeResponse;
        if (analyzeData.analysis) {
          setAnalysis(analyzeData.analysis);
          setAnalysisPersisted(Boolean(analyzeData.meta?.persisted));
        }
      } catch (analyzeErr) {
        const message = analyzeErr instanceof Error ? analyzeErr.message : 'CV-Analyse fehlgeschlagen';
        setAnalysisError(message);
      } finally {
        setIsAnalyzing(false);
      }

      // 2) Optional storage upload (non-blocking for extraction UX).
      if (supabaseBrowser) {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();
        if (!user?.id) {
          setUploadWarning('CV text extrahiert, aber Storage-Upload übersprungen: kein aktiver User.');
          setProgress(100);
          return;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/cv/${Date.now()}_${safeName}`;

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

      {isAnalyzing ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
          CV wird analysiert...
        </div>
      ) : null}

      {analysisError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          CV-Analyse konnte nicht persistiert werden: {analysisError}
        </div>
      ) : null}

      {analysis ? (
        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary">CV Intelligence</p>
              <p className="text-lg font-semibold text-text-primary">
                Rank {analysis.cvRank} · {analysis.rankTier}
              </p>
            </div>
            <div className="text-xs text-text-tertiary">
              {analysisPersisted ? 'Persisted in profile' : 'Analyze only (migration pending)'}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-background/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Top Strengths</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {analysis.topStrengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Top Gaps</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {analysis.topGaps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
