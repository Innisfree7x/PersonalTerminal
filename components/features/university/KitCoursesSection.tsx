'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { GraduationCap, CalendarDays, BookOpen } from 'lucide-react';

const ACTIVE_SEMESTER_KEY = 'innis:uni-active-semester:v1';

interface KitCourseRow {
  id: string;
  title: string;
  moduleCode: string | null;
  credits: number | null;
  status: 'active' | 'completed' | 'dropped' | 'planned' | 'unknown';
  semesterLabel: string | null;
  matchedExamDate: string | null;
  matchedExamTitle: string | null;
}

interface KitCoursesPayload {
  semesters: string[];
  modules: KitCourseRow[];
  totalCredits: number;
  availableSemesters: string[];
}

const statusLabel: Record<KitCourseRow['status'], string> = {
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  dropped: 'Abgebrochen',
  planned: 'Geplant',
  unknown: '—',
};

const statusTone: Record<KitCourseRow['status'], string> = {
  active: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-200',
  completed: 'border-sky-500/35 bg-sky-500/[0.1] text-sky-200',
  dropped: 'border-red-500/35 bg-red-500/[0.1] text-red-200',
  planned: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-200',
  unknown: 'border-white/15 bg-white/[0.05] text-white/60',
};

function formatCredits(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace('.', ',');
}

export default function KitCoursesSection() {
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ACTIVE_SEMESTER_KEY);
    if (stored) setSelectedSemester(stored);
    setHydrated(true);
  }, []);

  const queryKey = useMemo(
    () => ['university', 'kit-courses', selectedSemester ?? 'auto'],
    [selectedSemester]
  );

  const { data, isLoading, error } = useQuery<KitCoursesPayload>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSemester) params.set('semester', selectedSemester);
      const url = params.toString()
        ? `/api/university/kit-courses?${params.toString()}`
        : '/api/university/kit-courses';
      const response = await fetch(url);
      if (!response.ok) throw new Error('KIT-Kurse konnten nicht geladen werden.');
      return response.json() as Promise<KitCoursesPayload>;
    },
    staleTime: 60 * 1000,
    enabled: hydrated,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (selectedSemester) return;
    if (data?.semesters[0]) {
      setSelectedSemester(data.semesters[0]);
    }
  }, [data?.semesters, hydrated, selectedSemester]);

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    window.localStorage.setItem(ACTIVE_SEMESTER_KEY, value);
  };

  const availableSemesters = data?.availableSemesters ?? [];
  const activeSemester = selectedSemester ?? data?.semesters[0] ?? null;
  const modules = data?.modules ?? [];
  const totalCredits = data?.totalCredits ?? 0;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-surface/65 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-tertiary">
            <GraduationCap className="h-3.5 w-3.5" />
            KIT Semester
          </div>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            Kurse aus {activeSemester ?? 'deinem Semester'}
          </h2>
          <p className="text-xs text-text-secondary">
            Automatisch aus deinem letzten KIT-Sync — kein manuelles Nachpflegen nötig.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableSemesters.length > 0 ? (
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="uppercase tracking-[0.14em] text-text-tertiary">Semester</span>
              <select
                value={activeSemester ?? ''}
                onChange={(event) => handleSemesterChange(event.target.value)}
                className="rounded-lg border border-white/10 bg-surface px-2 py-1 text-xs text-text-primary focus:border-primary/60 focus:outline-none"
              >
                {availableSemesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.1] px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3 w-3" />
            {formatCredits(totalCredits)} ECTS
            <span className="text-primary/60">· {modules.length} Kurs{modules.length === 1 ? '' : 'e'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!hydrated || isLoading ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-text-tertiary">
            Kurse werden geladen…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-4 text-xs text-red-200">
            Laden fehlgeschlagen. Prüfe deinen KIT-Sync.
          </div>
        ) : modules.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-text-tertiary">
            Keine Module für dieses Semester gefunden. Stell sicher dass der KIT Academic Snapshot synchronisiert ist.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {modules.map((course) => (
              <li
                key={course.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-primary">{course.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-tertiary">
                    {course.moduleCode ? <span>{course.moduleCode}</span> : null}
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[course.status]}`}>
                      {statusLabel[course.status]}
                    </span>
                    {course.matchedExamDate ? (
                      <span className="inline-flex items-center gap-1 text-text-secondary">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(course.matchedExamDate), 'dd.MM.yyyy')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-text-primary tabular-nums">
                    {formatCredits(course.credits)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">ECTS</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
