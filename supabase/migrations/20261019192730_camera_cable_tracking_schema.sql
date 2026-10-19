/*
# Camera Cable Tracking Schema (single-tenant, no auth)

1. New Tables
- `buildings`: top-level site structure (e.g. Tower A).
  - id (uuid pk), name (text, unique not null), created_at (timestamptz)
- `floors`: belongs to a building.
  - id (uuid pk), building_id (uuid FK -> buildings ON DELETE CASCADE),
    name (text not null), floor_plan_url (text, nullable - public URL to drawing image),
    position (int, default 0 - manual ordering), created_at (timestamptz)
- `cameras`: belongs to a floor.
  - id (uuid pk), floor_id (uuid FK -> floors ON DELETE CASCADE),
    name (text not null), status (text NOT NULL DEFAULT 'pending', CHECK in pending/complete),
    location_x (numeric, 0-100 nullable - % position on floor plan),
    location_y (numeric, 0-100 nullable), notes (text), created_at (timestamptz)

2. Storage
- Create public bucket `floor-plans` for floor drawing image uploads.

3. Security
- RLS enabled on all three tables.
- Single-tenant no-auth app: anon + authenticated get full CRUD (data is intentionally shared).
- Storage: anon + authenticated can read all objects, and can insert/update/delete in floor-plans bucket.
*/

CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_buildings" ON buildings;
CREATE POLICY "anon_select_buildings" ON buildings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_buildings" ON buildings;
CREATE POLICY "anon_insert_buildings" ON buildings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_buildings" ON buildings;
CREATE POLICY "anon_update_buildings" ON buildings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_buildings" ON buildings;
CREATE POLICY "anon_delete_buildings" ON buildings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor_plan_url text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_floors" ON floors;
CREATE POLICY "anon_select_floors" ON floors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_floors" ON floors;
CREATE POLICY "anon_insert_floors" ON floors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_floors" ON floors;
CREATE POLICY "anon_update_floors" ON floors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_floors" ON floors;
CREATE POLICY "anon_delete_floors" ON floors FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete')),
  location_x numeric,
  location_y numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cameras" ON cameras;
CREATE POLICY "anon_select_cameras" ON cameras FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cameras" ON cameras;
CREATE POLICY "anon_insert_cameras" ON cameras FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cameras" ON cameras;
CREATE POLICY "anon_update_cameras" ON cameras FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cameras" ON cameras;
CREATE POLICY "anon_delete_cameras" ON cameras FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_cameras_floor ON cameras(floor_id);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);

-- Storage bucket for floor plans
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_floor_plans" ON storage.objects;
CREATE POLICY "anon_read_floor_plans" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'floor-plans');

DROP POLICY IF EXISTS "anon_insert_floor_plans" ON storage.objects;
CREATE POLICY "anon_insert_floor_plans" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'floor-plans');

DROP POLICY IF EXISTS "anon_update_floor_plans" ON storage.objects;
CREATE POLICY "anon_update_floor_plans" ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'floor-plans') WITH CHECK (bucket_id = 'floor-plans');

DROP POLICY IF EXISTS "anon_delete_floor_plans" ON storage.objects;
CREATE POLICY "anon_delete_floor_plans" ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'floor-plans');