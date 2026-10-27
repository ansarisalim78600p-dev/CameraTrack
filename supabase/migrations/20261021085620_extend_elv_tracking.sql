/*
# Extend ELV tracking items with categories and stage progress

1. Existing table changes
- `cameras.category`: category key for Camera, Access Control, WiFi, Gate Barrier, Speaker, Data Sock, or ELV Room.
- `cameras.cable_pulling`: pending or complete cable stage.
- `cameras.termination`: pending or complete termination stage.
- `cameras.device_installation`: pending, in progress, or complete device stage; used as Device for ELV Room.
- `cameras.dressing`: pending, in progress, or complete dressing stage for ELV Room.

2. Data preservation
- Existing rows remain in place with their names, floors, notes, location pins, and legacy status column untouched.
- Existing legacy status values are copied into cable_pulling.
- Existing rows remain in the camera category.

3. Security
- Existing RLS policies on `cameras` remain active and already cover the added columns for this single-tenant app.

4. Important notes
- This migration is additive and idempotent.
- The legacy status column is intentionally retained for rollback safety.
*/

ALTER TABLE cameras ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'camera';
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS cable_pulling text NOT NULL DEFAULT 'pending';
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS termination text NOT NULL DEFAULT 'pending';
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS device_installation text NOT NULL DEFAULT 'pending';
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS dressing text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_category_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_category_check CHECK (category IN ('camera','access_control','wifi','gate_barrier','speaker','data_sock','elv_room'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_cable_pulling_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_cable_pulling_check CHECK (cable_pulling IN ('pending','complete'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_termination_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_termination_check CHECK (termination IN ('pending','complete'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_device_installation_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_device_installation_check CHECK (device_installation IN ('pending','in_progress','complete'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_dressing_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_dressing_check CHECK (dressing IN ('pending','in_progress','complete'));
  END IF;
END $$;

UPDATE cameras SET cable_pulling = CASE WHEN status = 'complete' THEN 'complete' ELSE 'pending' END WHERE category = 'camera' OR category IS NULL;
CREATE INDEX IF NOT EXISTS idx_cameras_category ON cameras(category);