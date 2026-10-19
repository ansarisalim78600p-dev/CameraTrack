import { CheckCircle2, Clock, Camera, TrendingUp } from 'lucide-react';
import { computeSiteTotals } from '@/lib/export';
import type { BuildingWithNested } from '@/lib/supabase';

export function Dashboard({ buildings }: { buildings: BuildingWithNested[] }) {
  const t = computeSiteTotals(buildings);
  const cards = [
    { label: 'Total Points', value: t.total, icon: Camera, color: 'cyan' },
    { label: 'Completed', value: t.completed, icon: CheckCircle2, color: 'emerald' },
    { label: 'Pending', value: t.pending, icon: Clock, color: 'amber' },
    { label: 'Completion', value: `${t.pct}%`, icon: TrendingUp, color: 'violet' },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-400/30 text-cyan-300',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/30 text-emerald-300',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-400/30 text-amber-300',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-400/30 text-violet-300',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${colorMap[c.color]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-300">{c.label}</span>
                <Icon size={18} className="opacity-80" />
              </div>
              <div className="mt-2 text-3xl font-bold text-white">{c.value}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span className="uppercase tracking-wider">Overall Completion</span>
          <span className="font-semibold text-white">{t.pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${t.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
