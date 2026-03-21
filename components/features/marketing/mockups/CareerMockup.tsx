'use client';

/**
 * CareerMockup — HTML/CSS recreation of the Career Intelligence dashboard.
 *
 * Shows: Opportunity card with fit score, reach band, gap analysis,
 * CV strengths, and actionable next step.
 */

const gaps = [
  { label: 'DCF Modellierung', severity: 'high' as const },
  { label: 'M&A Case Experience', severity: 'medium' as const },
  { label: 'Deal-Sourcing Praxis', severity: 'low' as const },
];

const strengths = ['Quantitative Analyse', 'Financial Statements', 'Excel / VBA', 'Teamführung'];

const radarItems = [
  { company: 'Rothenstein Partners', role: 'Intern M&A Advisory', fit: 8.2, reach: 'Realistic' as const },
  { company: 'Meridian Capital', role: 'Summer Analyst', fit: 7.1, reach: 'Stretch' as const },
  { company: 'Atlas & Partners', role: 'Off-Cycle Intern', fit: 6.4, reach: 'Stretch' as const },
];

const reachConfig = {
  Realistic: { bg: 'bg-emerald-500/12', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Stretch: { bg: 'bg-[#E8B930]/12', text: 'text-[#E8B930]', border: 'border-[#E8B930]/20' },
};

const severityConfig = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  medium: { bg: 'bg-[#E8B930]/10', text: 'text-[#E8B930]', dot: 'bg-[#E8B930]' },
  low: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};

export function CareerMockup() {
  return (
    <div className="p-5 md:p-7">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8B930]/10">
            <svg className="h-4 w-4 text-[#E8B930]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white">Career Intelligence</h3>
            <p className="text-[10px] text-zinc-500">3 Opportunities · CV analysiert</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Opportunity Radar */}
        <div className="space-y-2">
          {radarItems.map((item, i) => {
            const reach = reachConfig[item.reach];
            return (
              <div
                key={item.company}
                className={`rounded-xl border bg-white/[0.02] p-4 transition-colors ${
                  i === 0 ? 'border-[#E8B930]/15' : 'border-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-white">{item.role}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{item.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[24px] font-bold tracking-tight text-[#E8B930]">{item.fit}</span>
                    <div className="mt-0.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${reach.bg} ${reach.text} ${reach.border}`}>
                        {item.reach}
                      </span>
                    </div>
                  </div>
                </div>
                {i === 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[9px] text-zinc-500">2 Quellen</span>
                    <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[9px] text-zinc-500">Track-fit direkt</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Gap Analysis + Strengths */}
        <div className="space-y-4">
          {/* Gaps */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Gap Analyse</p>
            <div className="space-y-2">
              {gaps.map((gap) => {
                const cfg = severityConfig[gap.severity];
                return (
                  <div key={gap.label} className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[12px] ${cfg.text}`}>{gap.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CV Strengths */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">CV Stärken</p>
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((s) => (
                <span key={s} className="rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Top Reason */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Top Reason</p>
            <p className="text-[13px] font-semibold text-white">Quantitative Stärke + M&A Fokus</p>
            <p className="mt-1 text-[11px] text-zinc-500">Passt zu Rothenstein Advisory Profil</p>
          </div>
        </div>
      </div>
    </div>
  );
}
