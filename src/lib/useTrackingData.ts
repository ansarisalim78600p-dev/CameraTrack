import { useCallback, useEffect, useState } from 'react';
import { supabase, type BuildingWithNested, type CameraPatch, type Floor } from './supabase';
import type { CategoryKey, StageField, StageValue } from './tracking';

export function useTrackingData() {
  const [buildings, setBuildings] = useState<BuildingWithNested[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error: queryError } = await supabase.from('buildings').select('*, floors(*, cameras(*))').order('name').order('position', { referencedTable: 'floors' }).order('name', { referencedTable: 'floors.cameras' });
    if (queryError) { setError(queryError.message); setBuildings([]); } else setBuildings((data ?? []) as BuildingWithNested[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (promise: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: actionError } = await promise;
    if (actionError) throw actionError;
    await load();
  };
  const addBuilding = (name: string) => run(supabase.from('buildings').insert({ name }));
  const updateBuilding = (id: string, name: string) => run(supabase.from('buildings').update({ name }).eq('id', id));
  const deleteBuilding = (id: string) => run(supabase.from('buildings').delete().eq('id', id));
  const addFloor = (buildingId: string, name: string, position: number) => run(supabase.from('floors').insert({ building_id: buildingId, name, position }));
  const updateFloor = (id: string, patch: Partial<Pick<Floor, 'name' | 'position' | 'floor_plan_url'>>) => run(supabase.from('floors').update(patch).eq('id', id));
  const deleteFloor = (id: string) => run(supabase.from('floors').delete().eq('id', id));
  const addItem = (floorId: string, category: CategoryKey, name: string) => run(supabase.from('cameras').insert({ floor_id: floorId, category, name, status: 'pending', cable_pulling: 'pending', termination: 'pending', fluke_test: 'pending', device_installation: 'pending', dressing: 'pending' }));
  const updateItem = (id: string, patch: CameraPatch) => run(supabase.from('cameras').update(patch).eq('id', id));
  const setItemStage = (id: string, field: StageField, value: StageValue) => run(supabase.from('cameras').update({ [field]: value }).eq('id', id));
  const deleteItem = (id: string) => run(supabase.from('cameras').delete().eq('id', id));

  return { buildings, loading, error, reload: load, addBuilding, updateBuilding, deleteBuilding, addFloor, updateFloor, deleteFloor, addItem, updateItem, setItemStage, deleteItem };
}
