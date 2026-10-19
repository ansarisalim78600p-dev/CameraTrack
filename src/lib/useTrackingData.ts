import { useCallback, useEffect, useState } from 'react';
import { supabase, type BuildingWithNested, type Camera, type CameraStatus, type Floor } from './supabase';

export function useTrackingData() {
  const [buildings, setBuildings] = useState<BuildingWithNested[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('buildings')
      .select('*, floors(*, cameras(*))')
      .order('name')
      .order('position', { referencedTable: 'floors' })
      .order('name', { referencedTable: 'floors.cameras' });
    if (error) {
      setError(error.message);
      setBuildings([]);
    } else {
      setBuildings((data ?? []) as BuildingWithNested[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Buildings
  const addBuilding = async (name: string) => {
    const { error } = await supabase.from('buildings').insert({ name });
    if (error) throw error;
    await load();
  };
  const updateBuilding = async (id: string, name: string) => {
    const { error } = await supabase.from('buildings').update({ name }).eq('id', id);
    if (error) throw error;
    await load();
  };
  const deleteBuilding = async (id: string) => {
    const { error } = await supabase.from('buildings').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  // Floors
  const addFloor = async (buildingId: string, name: string, position: number) => {
    const { error } = await supabase.from('floors').insert({ building_id: buildingId, name, position });
    if (error) throw error;
    await load();
  };
  const updateFloor = async (id: string, patch: Partial<Pick<Floor, 'name' | 'position' | 'floor_plan_url'>>) => {
    const { error } = await supabase.from('floors').update(patch).eq('id', id);
    if (error) throw error;
    await load();
  };
  const deleteFloor = async (id: string) => {
    const { error } = await supabase.from('floors').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  // Cameras
  const addCamera = async (floorId: string, name: string) => {
    const { error } = await supabase.from('cameras').insert({ floor_id: floorId, name, status: 'pending' });
    if (error) throw error;
    await load();
  };
  const updateCamera = async (id: string, patch: Partial<Camera>) => {
    const { error } = await supabase.from('cameras').update(patch).eq('id', id);
    if (error) throw error;
    await load();
  };
  const setCameraStatus = async (id: string, status: CameraStatus) => {
    const { error } = await supabase.from('cameras').update({ status }).eq('id', id);
    if (error) throw error;
    await load();
  };
  const deleteCamera = async (id: string) => {
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  return {
    buildings,
    loading,
    error,
    reload: load,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    addFloor,
    updateFloor,
    deleteFloor,
    addCamera,
    updateCamera,
    setCameraStatus,
    deleteCamera,
  };
}
