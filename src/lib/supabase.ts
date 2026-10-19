import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const FLOOR_PLANS_BUCKET = 'floor-plans';

export type Building = {
  id: string;
  name: string;
  created_at: string;
};

export type Floor = {
  id: string;
  building_id: string;
  name: string;
  floor_plan_url: string | null;
  position: number;
  created_at: string;
};

export type CameraStatus = 'pending' | 'complete';

export type Camera = {
  id: string;
  floor_id: string;
  name: string;
  status: CameraStatus;
  location_x: number | null;
  location_y: number | null;
  notes: string | null;
  created_at: string;
};

export type FloorWithNested = Floor & {
  cameras: Camera[];
};

export type BuildingWithNested = Building & {
  floors: FloorWithNested[];
};
