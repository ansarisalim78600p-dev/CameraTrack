import { useMemo, useState } from 'react';
import { Cable, Download, LayoutGrid, Map, Plus, RefreshCw } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { CameraTable } from '@/components/CameraTable';
import { FloorPlans } from '@/components/FloorPlans';
import { FormModal } from '@/components/FormModal';
import { ConfirmModal } from '@/components/Modal';
import { useTrackingData } from '@/lib/useTrackingData';
import { exportToXlsx } from '@/lib/export';
import type { BuildingWithNested, Camera, CameraStatus } from '@/lib/supabase';

type View = 'table' | 'floorplan';

type EditCameraState = { floorId: string; camera: Camera };

export default function App() {
  const t = useTrackingData();
  const [view, setView] = useState<View>('table');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');

  // modal state
  const [buildingModal, setBuildingModal] = useState<{ open: boolean; edit?: BuildingWithNested }>({ open: false });
  const [floorModal, setFloorModal] = useState<{ open: boolean; buildingId?: string; floorId?: string; name?: string }>({ open: false });
  const [cameraModal, setCameraModal] = useState<{ open: boolean; floorId?: string; camera?: Camera }>({ open: false });

  const [confirm, setConfirm] = useState<
    | { kind: 'building'; b: BuildingWithNested }
    | { kind: 'floor'; buildingId: string; floorId: string }
    | { kind: 'camera'; camId: string }
    | null
  >(null);

  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const findFloor = (buildingId: string, floorId: string) =>
    t.buildings.find((b) => b.id === buildingId)?.floors.find((f) => f.id === floorId);

  const onPlaceCamera = async (cam: Camera, x: number, y: number) => {
    try {
      await t.updateCamera(cam.id, { location_x: x, location_y: y });
      flash(`${cam.name} placed on plan`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed to place camera');
    }
  };
  const onClearLocation = async (cam: Camera) => {
    try {
      await t.updateCamera(cam.id, { location_x: null, location_y: null });
      flash(`${cam.name} removed from plan`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed');
    }
  };
  const onUploadPlan = async (floorId: string, url: string) => {
    try {
      await t.updateFloor(floorId, { floor_plan_url: url });
      flash('Floor plan uploaded');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Upload failed');
    }
  };
  const onRemovePlan = async (floorId: string) => {
    try {
      await t.updateFloor(floorId, { floor_plan_url: null });
      flash('Floor plan removed');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed');
    }
  };

  const onSetStatus = async (camId: string, status: CameraStatus) => {
    try {
      await t.setCameraStatus(camId, status);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleExport = () => {
    try {
      exportToXlsx(t.buildings);
      flash('Exported to .xlsx');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const floorModalField = useMemo(() => {
    if (!floorModal.open) return null;
    const f = floorModal.floorId ? findFloor(floorModal.buildingId!, floorModal.floorId!) : null;
    return f;
  }, [floorModal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 p-2.5 text-slate-900 shadow-lg shadow-cyan-500/20">
              <Cable size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">Cable Pull Tracker</h1>
              <p className="text-xs text-slate-400">Camera point progress across the construction site</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 bg-slate-900 p-0.5">
              <button
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  view === 'table' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} /> Table
              </button>
              <button
                onClick={() => setView('floorplan')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  view === 'floorplan' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Map size={14} /> Floor Plans
              </button>
            </div>
            <button
              onClick={() => t.reload()}
              title="Refresh"
              className="rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={16} className={t.loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Dashboard */}
        <div className="mb-6">
          <Dashboard buildings={t.buildings} />
        </div>

        {/* Main */}
        {t.loading && t.buildings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            Loading…
          </div>
        ) : t.error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-300">
            Could not load data: {t.error}
          </div>
        ) : view === 'table' ? (
          <CameraTable
            buildings={t.buildings}
            search={search}
            filter={filter}
            onSearch={setSearch}
            onFilter={setFilter}
            onAddBuilding={() => setBuildingModal({ open: true })}
            onEditBuilding={(b) => setBuildingModal({ open: true, edit: b })}
            onDeleteBuilding={(b) => setConfirm({ kind: 'building', b })}
            onAddFloor={(buildingId) => setFloorModal({ open: true, buildingId })}
            onEditFloor={(buildingId, floorId) => {
              const f = findFloor(buildingId, floorId);
              setFloorModal({ open: true, buildingId, floorId, name: f?.name });
            }}
            onDeleteFloor={(buildingId, floorId) => setConfirm({ kind: 'floor', buildingId, floorId })}
            onAddCamera={(floorId) => setCameraModal({ open: true, floorId })}
            onEditCamera={(camId) => {
              const found = t.buildings
                .flatMap((b) => b.floors)
                .find((f) => f.cameras.some((c) => c.id === camId));
              const cam = found?.cameras.find((c) => c.id === camId);
              if (found && cam) setCameraModal({ open: true, floorId: found.id, camera: cam });
            }}
            onDeleteCamera={(camId) => setConfirm({ kind: 'camera', camId })}
            onSetStatus={onSetStatus}
          />
        ) : (
          <FloorPlans
            buildings={t.buildings}
            onPlaceCamera={onPlaceCamera}
            onClearLocation={onClearLocation}
            onUploadPlan={onUploadPlan}
            onRemovePlan={onRemovePlan}
          />
        )}
      </div>

      {/* Building modal */}
      <FormModal
        open={buildingModal.open}
        title={buildingModal.edit ? 'Edit Building' : 'Add Building'}
        submitLabel={buildingModal.edit ? 'Update' : 'Add'}
        fields={[
          {
            kind: 'text',
            key: 'name',
            label: 'Building name',
            placeholder: 'e.g. Tower A',
            defaultValue: buildingModal.edit?.name ?? '',
            required: true,
          },
        ]}
        onClose={() => setBuildingModal({ open: false })}
        onSubmit={async (v) => {
          if (buildingModal.edit) await t.updateBuilding(buildingModal.edit.id, v.name as string);
          else await t.addBuilding(v.name as string);
        }}
      />

      {/* Floor modal */}
      <FormModal
        open={floorModal.open}
        title={floorModal.floorId ? 'Edit Floor' : 'Add Floor'}
        submitLabel={floorModal.floorId ? 'Update' : 'Add'}
        fields={[
          {
            kind: 'text',
            key: 'name',
            label: 'Floor name',
            placeholder: 'e.g. 1st Floor',
            defaultValue: floorModalField?.name ?? floorModal.name ?? '',
            required: true,
          },
          {
            kind: 'number',
            key: 'position',
            label: 'Sort order (lower shows first)',
            defaultValue: floorModalField?.position ?? 0,
          },
        ]}
        onClose={() => setFloorModal({ open: false })}
        onSubmit={async (v) => {
          if (floorModal.floorId) {
            await t.updateFloor(floorModal.floorId, { name: v.name as string, position: Number(v.position) });
          } else {
            await t.addFloor(floorModal.buildingId!, v.name as string, Number(v.position));
          }
        }}
      />

      {/* Camera modal */}
      <FormModal
        open={cameraModal.open}
        title={cameraModal.camera ? 'Edit Camera' : 'Add Camera Point'}
        submitLabel={cameraModal.camera ? 'Update' : 'Add'}
        fields={[
          {
            kind: 'text',
            key: 'name',
            label: 'Camera name',
            placeholder: 'e.g. C1, CAM-05',
            defaultValue: cameraModal.camera?.name ?? '',
            required: true,
          },
          {
            kind: 'text',
            key: 'notes',
            label: 'Notes (optional)',
            placeholder: 'e.g. North exit',
            defaultValue: cameraModal.camera?.notes ?? '',
          },
        ]}
        onClose={() => setCameraModal({ open: false })}
        onSubmit={async (v) => {
          if (cameraModal.camera) {
            await t.updateCamera(cameraModal.camera.id, { name: v.name as string, notes: v.notes as string });
          } else {
            await t.addCamera(cameraModal.floorId!, v.name as string);
          }
        }}
      />

      {/* Confirm delete */}
      <ConfirmModal
        open={!!confirm}
        title="Confirm delete"
        message={
          confirm?.kind === 'building'
            ? `Delete "${confirm.b.name}" and all its floors and cameras? This cannot be undone.`
            : confirm?.kind === 'floor'
              ? 'Delete this floor and all its cameras? This cannot be undone.'
              : confirm?.kind === 'camera'
                ? 'Delete this camera point?'
                : ''
        }
        onConfirm={async () => {
          if (!confirm) return;
          try {
            if (confirm.kind === 'building') await t.deleteBuilding(confirm.b.id);
            else if (confirm.kind === 'floor') await t.deleteFloor(confirm.floorId);
            else if (confirm.kind === 'camera') await t.deleteCamera(confirm.camId);
            flash('Deleted');
          } catch (e) {
            flash(e instanceof Error ? e.message : 'Delete failed');
          } finally {
            setConfirm(null);
          }
        }}
        onCancel={() => setConfirm(null)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Floating add button on mobile when table view */}
      {view === 'table' && (
        <button
          onClick={() => setBuildingModal({ open: true })}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 md:hidden"
        >
          <Plus size={18} /> Add
        </button>
      )}
    </div>
  );
}
