'use client';

type GradeRow = {
  moduleTitle: string;
  moduleCode: string | null;
  credits: number | null;
  gradeValue: number | null;
  gradeLabel: string;
  examDate: string | null;
};

export default function KitCampusGradesTable({
  rows,
  maxHeightClassName = 'max-h-[28rem]',
}: {
  rows: GradeRow[];
  maxHeightClassName?: string;
}) {
  return (
    <div className={`${maxHeightClassName} overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]`}>
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 border-b border-white/10 bg-[#0d1119]/95 backdrop-blur-sm">
          <tr className="text-xs uppercase tracking-[0.14em] text-text-tertiary">
            <th className="px-3 py-2.5 font-medium">Modul</th>
            <th className="px-3 py-2.5 font-medium text-right">Note</th>
            <th className="hidden px-3 py-2.5 font-medium text-right sm:table-cell">ECTS</th>
            <th className="hidden px-3 py-2.5 font-medium text-right md:table-cell">Datum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((mod, index) => {
            const gradeColor =
              mod.gradeValue === null
                ? 'text-text-secondary'
                : mod.gradeValue <= 1.5
                  ? 'text-emerald-400'
                  : mod.gradeValue <= 2.5
                    ? 'text-sky-400'
                    : mod.gradeValue <= 3.5
                      ? 'text-amber-400'
                      : 'text-red-400';

            return (
              <tr key={`${mod.moduleCode ?? mod.moduleTitle}-${index}`} className="transition-colors hover:bg-white/[0.03]">
                <td className="max-w-[220px] truncate px-3 py-2 text-text-primary" title={mod.moduleTitle}>
                  {mod.moduleCode ? (
                    <span className="mr-1.5 text-text-tertiary">{mod.moduleCode}</span>
                  ) : null}
                  {mod.moduleTitle}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${gradeColor}`}>
                  {mod.gradeLabel}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-text-secondary sm:table-cell">
                  {mod.credits !== null ? mod.credits : '–'}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-text-secondary md:table-cell">
                  {mod.examDate ?? '–'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
