/*
# Allow In Progress for every installation stage

1. Existing table changes
- `cameras.cable_pulling` now accepts pending, in_progress, or complete.
- `cameras.termination` now accepts pending, in_progress, or complete.
- Existing device_installation and dressing values remain unchanged.

2. Data preservation
- No rows or columns are deleted or renamed.
- Existing pending and complete values remain valid.

3. Security
- Existing RLS policies remain unchanged and continue to cover the cameras table.

4. Important notes
- This additive constraint update keeps all stage dropdowns consistent across categories.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_cable_pulling_check') THEN
    ALTER TABLE cameras DROP CONSTRAINT cameras_cable_pulling_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_termination_check') THEN
    ALTER TABLE cameras DROP CONSTRAINT cameras_termination_check;
  END IF;
END $$;

ALTER TABLE cameras ADD CONSTRAINT cameras_cable_pulling_check CHECK (cable_pulling IN ('pending','in_progress','complete'));
ALTER TABLE cameras ADD CONSTRAINT cameras_termination_check CHECK (termination IN ('pending','in_progress','complete'));