import type { BuildingWithNested, Camera } from './supabase';

export const CATEGORY_KEYS = ['camera', 'access_control', 'wifi', 'gate_barrier', 'speaker', 'data_sock', 'elv_room'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];
export type StageValue = 'pending' | 'in_progress' | 'complete';
export type ItemStatus = 'pending' | 'in_progress' | 'complete';
export type StageField = 'cable_pulling' | 'termination' | 'fluke_test' | 'device_installation' | 'dressing';

export const CATEGORY_META: Record<CategoryKey, { label: string; accent: string; dot: string }> = {
  camera: { label: 'Camera', accent: '#22D3EE', dot: 'bg-cyan-400' },
  access_control: { label: 'Access Control', accent: '#A78BFA', dot: 'bg-violet-400' },
  wifi: { label: 'WiFi', accent: '#60A5FA', dot: 'bg-blue-400' },
  gate_barrier: { label: 'Gate Barrier', accent: '#FB923C', dot: 'bg-orange-400' },
  speaker: { label: 'Speaker', accent: '#F472B6', dot: 'bg-pink-400' },
  data_sock: { label: 'Data Sock', accent: '#818CF8', dot: 'bg-indigo-400' },
  elv_room: { label: 'ELV Room', accent: '#34D399', dot: 'bg-emerald-400' },
};

export const STANDARD_STAGES: { field: StageField; label: string }[] = [
  { field: 'cable_pulling', label: 'Cable Pulling' },
  { field: 'termination', label: 'Termination' },
  { field: 'fluke_test', label: 'Fluke Test' },
  { field: 'device_installation', label: 'Device Installation' },
];

export const ELV_STAGES: { field: StageField; label: string }[] = [
  { field: 'device_installation', label: 'Device' },
  { field: 'dressing', label: 'Dressing' },
];

export function stagesFor(category: CategoryKey) {
  return category === 'elv_room' ? ELV_STAGES : STANDARD_STAGES;
}

export function getItemStatus(item: Camera): ItemStatus {
  const stages = stagesFor(item.category);
  const values = stages.map(({ field }) => item[field]);
  if (values.every((value) => value === 'complete')) return 'complete';
  if (values.every((value) => value === 'pending')) return 'pending';
  return 'in_progress';
}

export function itemMatchesFilter(item: Camera, filter: ItemStatus): boolean {
  if (filter === 'complete') return getItemStatus(item) === 'complete';
  const stages = stagesFor(item.category);
  return stages.some(({ field }) => item[field] === filter);
}

export function getProgress(items: Camera[]) {
  let totalStages = 0;
  let completedStages = 0;
  for (const item of items) {
    const stages = stagesFor(item.category);
    totalStages += stages.length;
    completedStages += stages.filter(({ field }) => item[field] === 'complete').length;
  }
  return {
    totalItems: items.length,
    completedItems: items.filter((item) => getItemStatus(item) === 'complete').length,
    inProgressItems: items.filter((item) => itemMatchesFilter(item, 'in_progress')).length,
    pendingItems: items.filter((item) => itemMatchesFilter(item, 'pending')).length,
    totalStages,
    completedStages,
    completion: totalStages ? Math.round((completedStages / totalStages) * 1000) / 10 : 0,
  };
}

export function allItems(buildings: BuildingWithNested[]) {
  return buildings.flatMap((building) => building.floors.flatMap((floor) => floor.cameras));
}

export function categoryItems(buildings: BuildingWithNested[], category: CategoryKey) {
  return allItems(buildings).filter((item) => item.category === category);
}
