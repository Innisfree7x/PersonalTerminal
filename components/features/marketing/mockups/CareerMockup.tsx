'use client';

/**
 * CareerMockup — Redesigned for marketing impact.
 *
 * One opportunity, deeply analyzed.
 * Fit score hero → strengths vs gaps → actionable next step.
 *
 * Story: "We know what you're missing for this exact role."
 */

const strengths = ['Quantitative Analyse', 'Financial Statements', 'Excel / VBA'];

const gaps = [
  { label: 'DCF Modellierung', severity: 'high' as const },
  { label: 'M&A Case Experience', severity: 'medium' as const },
];

const severityStyle = {
  high: { dot: 'bg-red-400', text: 'text-red-400', badge: 'text-red-400/70' },
  medium: { dot: 'bg-[#E8B930]', text: 'text-[#E8B930]', badge: 'text-[#E8B930]/70' },
};

export function CareerMockup() {
  return (
    <div className="px-5 py-6 md:px-7 md:py-8">
      {/* Opportunity header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8B930]/20 to-[#E8B930]/5">
              <span className="text-[13px] font-bold text-[#E8B930]">R</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">Intern M&A Advisory</p>
              <p className="text-[11px] text-zinc-500">Rothenstein Partners · Frankfurt</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[32px] font-bold tracking-tight text-[#E8B930]">8.2</span>
          <div className="mt-0.5">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
              Realistic
            </span>
          </div>
        </div>
      </div>

      {/* Two-column: Strengths vs Gaps */}
      <div className="grid grid-cols-2 gap-3">
        {/* Strengths */}
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-emerald-400/60">
            Was du mitbringst
          </p>
          <div className="space-y-2">
            {strengths.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <svg className="h-3 w-3 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[11px] text-emerald-400/90">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps */}
        <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-red-400/60">
            Was dir fehlt
          </p>
          <div className="space-y-2">
            {gaps.map((gap) => {
              const s = severityStyle[gap.severity];
              return (
                <div key={gap.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    <span className={`text-[11px] ${s.text}`}>{gap.label}</span>
                  </div>
                  <span className={`text-[9px] font-medium ${s.badge}`}>{gap.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Next step — the actionable insight */}
      <div className="flex items-center gap-3 rounded-xl border border-[#E8B930]/12 bg-[#E8B930]/[0.03] px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8B930]/15">
          <svg className="h-3.5 w-3.5 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white">Nächster Schritt: DCF-Kurs abschließen</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">Schließt die größte Lücke für Rothenstein</p>
        </div>
      </div>
    </div>
  );
}
