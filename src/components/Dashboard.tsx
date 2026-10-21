import { CheckCircle2, Clock3, Layers3, LoaderCircle } from 'lucide-react';
import type { BuildingWithNested } from '@/lib/supabase';
import { CATEGORY_KEYS, CATEGORY_META, categoryItems, getProgress, type CategoryKey } from '@/lib/tracking';

export function Dashboard({ buildings, selected, onSelect }: { buildings: BuildingWithNested[]; selected: CategoryKey; onSelect: (category: CategoryKey) => void }) {
  const overall = getProgress(buildings.flatMap((building) => building.floors.flatMap((floor) => floor.cameras)));
  const cards = [
    { label: 'Total Items', value: overall.totalItems, icon: Layers3, color: 'cyan' },
    { label: 'Completed', value: overall.completedItems, icon: CheckCircle2, color: 'emerald' },
    { label: 'In Progress', value: overall.inProgressItems, icon: LoaderCircle, color: 'blue' },
    { label: 'Pending', value: overall.pendingItems, icon: Clock3, color: 'amber' },
    { label: 'Completion', value: `${overall.completion}%`, icon: CheckCircle2, color: 'violet' },
  ];
  const colors: Record<string, string> = { cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300', emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300', blue: 'border-blue-400/30 bg-blue-500/10 text-blue-300', amber: 'border-amber-400/30 bg-amber-500/10 text-amber-300', violet: 'border-violet-400/30 bg-violet-500/10 text-violet-300' };
  return <>
    <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/30 backdrop-blur md:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => <div key={label} className={`rounded-xl border p-4 ${colors[color]}`}><div className="flex items-center justify-between"><span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">{label}</span><Icon size={17} /></div><div className="mt-2 text-3xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 18px currentColor' }}>{value}</div></div>)}
      </div>
      <div className="mt-5"><div className="mb-2 flex justify-between text-xs uppercase tracking-wider text-slate-400"><span>Overall completion</span><span className="text-white">{overall.completion}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 transition-all duration-500" style={{ width: `${overall.completion}%` }} /></div></div>
    </section>
    <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {CATEGORY_KEYS.map((category) => { const p = getProgress(categoryItems(buildings, category)); const meta = CATEGORY_META[category]; return <button key={category} onClick={() => onSelect(category)} className={`rounded-2xl border bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-800/80 ${selected === category ? 'ring-2 ring-cyan-400/70' : 'border-white/10'}`} style={{ borderColor: selected === category ? meta.accent : undefined }}><div className="flex items-center justify-between"><span className="text-sm font-semibold" style={{ color: meta.accent }}>{meta.label}</span><span className="text-xl font-bold text-white" style={{ textShadow: `0 0 15px ${meta.accent}` }}>{p.completion}%</span></div><p className="mt-1 text-xs text-slate-400">{p.totalItems} items total</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full transition-all" style={{ width: `${p.completion}%`, backgroundColor: meta.accent }} /></div><div className="mt-3 flex justify-between text-[11px]"><span className="text-emerald-300">{p.completedItems} done</span><span className="text-cyan-300">{p.inProgressItems} progress</span><span className="text-amber-300">{p.pendingItems} pending</span></div></button>; })}
    </section>
  </>;
}
