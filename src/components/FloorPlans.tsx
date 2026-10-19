import { useRef, useState } from 'react';
import { Building2, ImagePlus, Layers, MapPin, Trash2, Upload } from 'lucide-react';
import type { BuildingWithNested, Camera } from '@/lib/supabase';
import { FLOOR_PLANS_BUCKET, supabase } from '@/lib/supabase';

type Props = {
  buildings: BuildingWithNested[];
  onPlaceCamera: (cam: Camera, x: number, y: number) => void;
  onClearLocation: (cam: Camera) => void;
  onUploadPlan: (floorId: string, url: string) => void;
  onRemovePlan: (floorId: string) => void;
};

export function FloorPlans(props: Props) {
  const { buildings } = props;
  const [activeFloor, setActiveFloor] = useState<{ buildingId: string; floorId: string } | null>(() => {
    const b = buildings[0];
    const f = b?.floors[0];
    return b && f ? { buildingId: b.id, floorId: f.id } : null;
  });

  // keep activeFloor valid as data reloads
  const allFloors = buildings.flatMap((b) => b.floors.map((f) => ({ buildingId: b.id, buildingName: b.name, floor: f })));
  const active =
    allFloors.find((x) => x.floor.id === activeFloor?.floorId) ?? allFloors[0] ?? null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl shadow-black/30 backdrop-blur">
      <div className="border-b border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Floor</label>
          <select
            value={active?.floor.id ?? ''}
            onChange={(e) => {
              const f = allFloors.find((x) => x.floor.id === e.target.value);
              if (f) setActiveFloor({ buildingId: f.buildingId, floorId: f.floor.id });
            }}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            {buildings.map((b) => (
              <optgroup key={b.id} label={b.name}>
                {b.floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {active && <span className="text-xs text-slate-500">{allFloors.length} floor(s) available</span>}
        </div>
      </div>

      {active ? (
        <FloorCanvas
          key={active.floor.id}
          buildingName={active.buildingName}
          floorName={active.floor.name}
          floor={active.floor}
          onPlaceCamera={(cam, x, y) => props.onPlaceCamera(cam, x, y)}
          onClearLocation={(cam) => props.onClearLocation(cam)}
          onUploadPlan={(url) => props.onUploadPlan(active.floor.id, url)}
          onRemovePlan={() => props.onRemovePlan(active.floor.id)}
        />
      ) : (
        <div className="px-4 py-10 text-center text-sm text-slate-400">
          Add a building and floor first to attach a floor plan.
        </div>
      )}
    </div>
  );
}

function FloorCanvas({
  buildingName,
  floorName,
  floor,
  onPlaceCamera,
  onClearLocation,
  onUploadPlan,
  onRemovePlan,
}: {
  buildingName: string;
  floorName: string;
  floor: BuildingWithNested['floors'][number];
  onPlaceCamera: (cam: Camera, x: number, y: number) => void;
  onClearLocation: (cam: Camera) => void;
  onUploadPlan: (url: string) => void;
  onRemovePlan: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${floor.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(FLOOR_PLANS_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(FLOOR_PLANS_BUCKET).getPublicUrl(path);
      onUploadPlan(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const onClickCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const cam = floor.cameras.find((c) => c.id === selected);
    if (cam) onPlaceCamera(cam, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Building2 size={15} className="text-cyan-300" />
          <span className="font-medium">{buildingName}</span>
          <span className="text-slate-500">/</span>
          <Layers size={15} className="text-violet-300" />
          <span className="font-medium">{floorName}</span>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : (<><Upload size={14} /> Upload plan</>)}
          </button>
          {floor.floor_plan_url && (
            <button
              onClick={onRemovePlan}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
      </div>

      {err && <p className="mb-2 text-sm text-rose-400">{err}</p>}

      {/* Camera picker */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {floor.cameras.length === 0 && <span className="text-xs text-slate-500">No cameras on this floor yet.</span>}
        {floor.cameras.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(selected === c.id ? null : c.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${
              selected === c.id
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                : c.location_x != null
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-slate-800 text-slate-300 hover:bg-white/10'
            }`}
          >
            <MapPin size={12} />
            {c.name}
            {c.location_x != null && <span className="text-[10px] opacity-70">placed</span>}
          </button>
        ))}
      </div>

      {selected && (
        <p className="mb-2 text-xs text-cyan-300">
          Click on the drawing to drop the selected camera. Click an existing pin to clear it.
        </p>
      )}

      {floor.floor_plan_url ? (
        <div
          onClick={onClickCanvas}
          className={`relative w-full overflow-hidden rounded-xl border ${
            selected ? 'border-cyan-400 cursor-crosshair' : 'border-white/10'
          }`}
          style={{ aspectRatio: '16 / 10' }}
        >
          <img src={floor.floor_plan_url} alt={`${floorName} plan`} className="absolute inset-0 h-full w-full object-contain bg-slate-950" />
          {floor.cameras.map((c) =>
            c.location_x == null || c.location_y == null ? null : (
              <button
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onClearLocation(c);
                }}
                title={`${c.name} — click to clear`}
                style={{ left: `${c.location_x}%`, top: `${c.location_y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 shadow-lg transition hover:scale-125 ${
                  c.status === 'complete' ? 'bg-emerald-400 text-slate-900' : 'bg-amber-400 text-slate-900'
                }`}
              >
                <MapPin size={14} />
              </button>
            ),
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-10 text-center" style={{ aspectRatio: '16 / 10' }}>
          <ImagePlus size={32} className="mb-2 text-slate-500" />
          <p className="text-sm text-slate-400">No floor plan attached.</p>
          <p className="text-xs text-slate-500">Click “Upload plan” to attach a drawing (PNG/JPG).</p>
        </div>
      )}
    </div>
  );
}

