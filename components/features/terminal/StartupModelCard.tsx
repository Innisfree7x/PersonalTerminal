'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StartupModelCardProps {
  onScheduleSession?: ((title: string, durationMin: number) => Promise<void>) | undefined;
}

interface Milestone {
  id: string;
  title: string;
  done: boolean;
  target: string;
}

interface MonthlyMetric {
  month: string;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
  netBurn: number;
  cashEnding: number;
  runwayMonths: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
}

interface FinancialModelData {
  modelName: string;
  sourceFile: string;
  lastUpdated: string;
  activeScenario?: string;
  kpis: {
    fy2022Revenue: number;
    fy2022GrossProfit: number;
    fy2022GrossMargin: number;
    fy2022ContributionMargin: number;
    startingCash: number;
    currentCash: number;
    projectedDecCash: number;
    initialBurnRate: number;
    initialRunwayMonths: number;
    breakevenMonth: string;
    enterpriseValueEbitda: number;
    enterpriseValueGordon: number;
    terminalValue: number;
    wacc: number;
    exitMultiple: number;
  };
  monthly: MonthlyMetric[];
  dcf: {
    sumPvFcf: number;
    pvTerminalValue: number;
    impliedEnterpriseValue: number;
  };
}

const DEFAULT_MILESTONES: Milestone[] = [
  { id: '1', title: 'Financial Model & Sensitivitätsanalyse validieren', done: true, target: 'Erledigt' },
  { id: '2', title: 'Customer Discovery & Value Proposition schärfen', done: false, target: 'Diese Woche' },
  { id: '3', title: 'MVP / Prototyp Fertigstellung & Alpha-Testing', done: false, target: 'Ende Q4' },
  { id: '4', title: 'Go-to-Market & Erste 20 zahlende Kunden onboarden', done: false, target: 'Q1 2027' },
];

export default function StartupModelCard({ onScheduleSession }: StartupModelCardProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [isScheduling, setIsScheduling] = useState(false);
  const [model, setModel] = useState<FinancialModelData | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'base' | 'bull' | 'bear'>('base');
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch model data from API
  useEffect(() => {
    let isMounted = true;
    async function loadModel(scenario: string) {
      try {
        const res = await fetch(`/api/startup/financial-model?scenario=${scenario}`);
        if (!res.ok) throw new Error('Failed to fetch model');
        const data = await res.json();
        if (isMounted) setModel(data);
      } catch (err) {
        console.error('Failed to load startup financial model:', err);
      }
    }
    loadModel(selectedScenario);
    return () => {
      isMounted = false;
    };
  }, [selectedScenario]);

  const handleRefreshFromXlsx = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/startup/financial-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reparse' }),
      });
      if (!res.ok) throw new Error('Reparse failed');
      const data = await res.json();
      if (data.data) {
        setModel(data.data);
        toast.success('Financial Model erfolgreich aus Excel synchronisiert!');
      }
    } catch {
      toast.error('Konnte Excel-Datei nicht re-parsen');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    );
    toast.success('Meilenstein-Status aktualisiert');
  };

  const handleSchedule = async (title: string) => {
    if (!onScheduleSession) return;
    setIsScheduling(true);
    try {
      await onScheduleSession(`Startup Fokus: ${title}`, 60);
      toast.success('60 Min Startup-Fokus in Google Kalender geblockt!');
    } catch {
      toast.error('Fehler beim Planen im Kalender');
    } finally {
      setIsScheduling(false);
    }
  };

  const completedCount = milestones.filter((m) => m.done).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  // Fallbacks if loading
  const kpis = model?.kpis ?? {
    fy2022Revenue: 88342,
    fy2022GrossProfit: 61928,
    fy2022GrossMargin: 70.1,
    startingCash: 50000,
    currentCash: 47200,
    initialRunwayMonths: 20.5,
    initialBurnRate: 2300,
    enterpriseValueEbitda: 248470,
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-md overflow-hidden shadow-2xl space-y-4 p-5 transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase">
                STARTUP & FINANCIAL MODEL HUB
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                IB-MODEL AKTIV
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">
              Live aus Startup-IB-Financial-Model.xlsx · DCF-Valuation & Unit Economics
            </p>
          </div>
        </div>

        {/* Right Controls: Scenario Switcher & Sync */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedScenario('base')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                selectedScenario === 'base'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Base (1.0x)
            </button>
            <button
              type="button"
              onClick={() => setSelectedScenario('bull')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                selectedScenario === 'bull'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Bull (+25%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedScenario('bear')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                selectedScenario === 'bear'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Bear (-25%)
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefreshFromXlsx}
            disabled={isRefreshing}
            title="Neu aus Excel laden"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Financial Key Metrics Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[10px] font-mono text-white/40 uppercase">Cash & Runway</span>
          <div className="text-sm font-bold font-mono text-emerald-400">
            ${kpis.currentCash.toLocaleString()}
          </div>
          <span className="text-[9px] font-mono text-emerald-400/80 block">
            {kpis.initialRunwayMonths.toFixed(1)} Monate Puffer
          </span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[10px] font-mono text-white/40 uppercase">FY Projektion</span>
          <div className="text-sm font-bold font-mono text-cyan-400">
            ${kpis.fy2022Revenue.toLocaleString()}
          </div>
          <span className="text-[9px] font-mono text-white/40 block">Jahresumsatz (Modell)</span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[10px] font-mono text-white/40 uppercase">Bruttomarge</span>
          <div className="text-sm font-bold font-mono text-amber-400">
            {kpis.fy2022GrossMargin.toFixed(1)}%
          </div>
          <span className="text-[9px] font-mono text-white/40 block">
            ${kpis.fy2022GrossProfit.toLocaleString()} GP
          </span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[10px] font-mono text-white/40 uppercase">DCF Valuation</span>
          <div className="text-sm font-bold font-mono text-indigo-400">
            ${kpis.enterpriseValueEbitda.toLocaleString()}
          </div>
          <span className="text-[9px] font-mono text-white/40 block">10x EV/EBITDA Implied</span>
        </div>
      </div>

      {/* Collapsible Model Details (Monthly Timeline & Unit Economics) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs font-mono text-white/60 hover:text-white transition-all"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Monatliche Trajektorie & Unit Economics {showDetails ? 'ausblenden' : 'einblenden'}</span>
          </div>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetails && model?.monthly && (
          <div className="mt-3 p-3 rounded-xl border border-white/5 bg-[#070A12] space-y-3 animate-in fade-in duration-200">
            <div className="text-[11px] font-mono text-white/50 flex items-center justify-between">
              <span>Monatsverlauf (Umsatz, Marge, Burn & Cash)</span>
              <span className="text-emerald-400">Break-even: Monat {model.kpis.breakevenMonth}</span>
            </div>

            <div className="overflow-x-auto text-[11px] font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase">
                    <th className="py-1 px-2">Monat</th>
                    <th className="py-1 px-2">Umsatz</th>
                    <th className="py-1 px-2">Gross Margin</th>
                    <th className="py-1 px-2">Net Burn</th>
                    <th className="py-1 px-2">End Cash</th>
                    <th className="py-1 px-2">CAC</th>
                    <th className="py-1 px-2">LTV</th>
                    <th className="py-1 px-2">LTV/CAC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {model.monthly.map((m) => (
                    <tr key={m.month} className="hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 font-semibold text-white">{m.month}</td>
                      <td className="py-1.5 px-2 text-cyan-400">${m.revenue.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-amber-400">{m.grossMargin}%</td>
                      <td className={`py-1.5 px-2 ${m.netBurn > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {m.netBurn > 0 ? `-$${m.netBurn.toLocaleString()}` : '$0 (Profitable)'}
                      </td>
                      <td className="py-1.5 px-2 text-emerald-400">${m.cashEnding.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-white/60">${m.cac}</td>
                      <td className="py-1.5 px-2 text-white/60">${m.ltv}</td>
                      <td className="py-1.5 px-2 font-semibold text-emerald-300">{m.ltvCacRatio}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Roadmaps & Meilensteine */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white/60 font-semibold uppercase text-[11px]">
            Nächste Meilensteine ({completedCount}/{milestones.length})
          </span>
          <span className="text-white/40">{progressPercent}% erreicht</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-2 pt-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all ${
                m.done
                  ? 'border-white/5 bg-white/[0.01] opacity-50'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleMilestone(m.id)}
                  className="flex-shrink-0 text-white/40 hover:text-emerald-400 transition-colors"
                >
                  {m.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30" />
                  )}
                </button>
                <span
                  className={`text-xs truncate font-medium ${
                    m.done ? 'line-through text-white/40' : 'text-white'
                  }`}
                >
                  {m.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  {m.target}
                </span>
                {!m.done && onScheduleSession && (
                  <button
                    type="button"
                    onClick={() => handleSchedule(m.title)}
                    disabled={isScheduling}
                    className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all"
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    Blocken
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
