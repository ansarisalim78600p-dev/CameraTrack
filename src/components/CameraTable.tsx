import { useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Layers, Camera as CameraIcon } from 'lucide-react';
import type { BuildingWithNested, CameraStatus } from '@/lib/supabase';
import { computeFloorTotal } from '@/lib/export';

type Props = {
  buildings: BuildingWithNested[];
  onAddBuilding: () => void;
  onEditBuilding: (b: BuildingWithNested) => void;
  onDeleteBuilding: (b: BuildingWithNested) => void;
  onAddFloor: (buildingId: string) => void;
  onEditFloor: (buildingId: string, floorId: string) => void;
  onDeleteFloor: (buildingId: string, floorId: string) => void;
  onAddCamera: (floorId: string) => void;
  onEditCamera: (camId: string) => void;
  onDeleteCamera: (camId: string) => void;
  onSetStatus: (camId: string, status: CameraStatus) => void;
  search: string;
  filter: 'all' | 'pending' | 'complete';
  onSearch: (s: string) => void;
  onFilter: (f: 'all' | 'pending' | 'complete') => void;
};

export function CameraTable(props: Props) {
  const { buildings, search, filter, onSearch, onFilter } = props;
  const [openBuildings, setOpenBuildings] = useState<Set<string>>(new Set(buildings.map((b) => b.id)));
  const [openFloors, setOpenFloors] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const q = search.trim().toLowerCase();
  const matches = (name: string) => !q || name.toLowerCase().includes(q);

  // auto-expand building/floor that contains a matching camera when searching
  const expandedBuildings = useMemo(() => {
    if (!q) return openBuildings;
    const s = new Set(openBuildings);
    for (const b of buildings) {
      if (matches(b.name)) s.add(b.id);
      else if (b.floors.some((f) => matches(f.name) || f.cameras.some((c) => matches(c.name)))) s.add(b.id);
    }
    return s;
  }, [q, buildings, openBuildings]);

  const expandedFloors = useMemo(() => {
    if (!q) return openFloors;
    const s = new Set(openFloors);
    for (const b of buildings) {
      for (const f of b.floors) {
        if (matches(f.name) || f.cameras.some((c) => matches(c.name))) s.add(f.id);
      }
    }
    return s;
  }, [q, buildings, openFloors]);

  const statusColor = (s: CameraStatus) =>
    s === 'complete'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
      : 'bg-amber-500/15 text-amber-300 border-amber-400/40';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl shadow-black/30 backdrop-blur">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search cameras, floors, buildings…"
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:max-w-xs"
          />
          <div className="flex rounded-lg border border-white/10 bg-slate-800 p-0.5">
            {(['all', 'pending', 'complete'] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filter === f ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={props.onAddBuilding}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
        >
          <Plus size={16} /> Building
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-white/5">
        {buildings.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No buildings yet. Click “Building” to add the first one.
          </div>
        )}
        {buildings.map((b) => {
          const bOpen = expandedBuildings.has(b.id);
          const bTotals = computeFloorTotal({ cameras: b.floors.flatMap((f) => f.cameras) });
          return (
            <div key={b.id}>
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-white/[0.03]">
                <button
                  onClick={() => toggle(openBuildings, b.id, setOpenBuildings)}
                  className="rounded p-1 text-slate-400 hover:text-white"
                >
                  {bOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Building2 size={18} className="text-cyan-300" />
                <span className="flex-1 font-semibold text-white">{b.name}</span>
                <span className="hidden text-xs text-slate-400 sm:inline">
                  {bTotals.completed}/{bTotals.total} · {bTotals.pct}%
                </span>
                <div className="flex items-center gap-1">
                  <IconBtn label="Add floor" onClick={() => props.onAddFloor(b.id)}><Plus size={15} /></IconBtn>
                  <IconBtn label="Edit building" onClick={() => props.onEditBuilding(b)}><Pencil size={15} /></IconBtn>
                  <IconBtn label="Delete building" danger onClick={() => props.onDeleteBuilding(b)}><Trash2 size={15} /></IconBtn>
                </div>
              </div>

              {bOpen && (
                <div className="bg-black/20">
                  {b.floors.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-500">No floors yet.</div>
                  )}
                  {b.floors.map((f) => {
                    const fOpen = expandedFloors.has(f.id);
                    const fT = computeFloorTotal(f);
                    const cams = f.cameras.filter(
                      (c) => (filter === 'all' || c.status === filter) && (!q || matches(c.name) || matches(f.name)),
                    );
                    const showFloor = filter === 'all' || cams.length > 0 || matches(f.name);
                    if (!showFloor) return null;
                    return (
                      <div key={f.id} className="border-t border-white/5">
                        <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.02]">
                          <button
                            onClick={() => toggle(openFloors, f.id, setOpenFloors)}
                            className="rounded p-1 text-slate-400 hover:text-white"
                          >
                            {fOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <Layers size={15} className="text-violet-300" />
                          <span className="flex-1 text-sm font-medium text-slate-200">{f.name}</span>
                          <span className="text-xs text-slate-400">{fT.completed}/{fT.total}</span>
                          <IconBtn label="Add camera" onClick={() => props.onAddCamera(f.id)}><Plus size={14} /></IconBtn>
                          <IconBtn label="Edit floor" onClick={() => props.onEditFloor(b.id, f.id)}><Pencil size={14} /></IconBtn>
                          <IconBtn label="Delete floor" danger onClick={() => props.onDeleteFloor(b.id, f.id)}><Trash2 size={14} /></IconBtn>
                        </div>

                        {fOpen && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                                  <th className="px-6 py-2 font-medium">Camera</th>
                                  <th className="px-3 py-2 font-medium">Status</th>
                                  <th className="px-3 py-2 font-medium">Change</th>
                                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {cams.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-xs text-slate-500">
                                      No cameras match.
                                    </td>
                                  </tr>
                                )}
                                {cams.map((c) => (
                                  <tr key={c.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-2.5">
                                      <div className="flex items-center gap-2 text-slate-200">
                                        <CameraIcon size={14} className="text-slate-500" />
                                        {c.name}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                                        {c.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <select
                                        value={c.status}
                                        onChange={(e) => props.onSetStatus(c.id, e.target.value as CameraStatus)}
                                        className="rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="complete">Complete</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      <div className="inline-flex items-center gap-1">
                                        <IconBtn label="Edit camera" onClick={() => props.onEditCamera(c.id)}><Pencil size={14} /></IconBtn>
                                        <IconBtn label="Delete camera" danger onClick={() => props.onDeleteCamera(c.id)}><Trash2 size={14} /></IconBtn>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-md p-1.5 transition ${
        danger ? 'text-slate-400 hover:bg-rose-500/15 hover:text-rose-300' : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
