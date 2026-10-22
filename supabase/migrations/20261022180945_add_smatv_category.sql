/*
# Add SMATV device category

1. Existing table changes
- `cameras.category` CHECK constraint updated to include 'smatv' alongside the existing
  values (camera, access_control, wifi, gate_barrier, speaker, data_sock, elv_room).
- SMATV uses the same standard stages as Camera: Cable Pulling, Termination, Fluke Test,
  Device Installation.

2. Data preservation
- No rows or columns are deleted or renamed.
- Existing rows and their category values remain valid.

3. Security
- Existing RLS policies remain unchanged and continue to cover the cameras table.

4. Important notes
- This migration is additive and idempotent.
- The old constraint is dropped and replaced with one that includes 'smatv'.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_category_check') THEN
    ALTER TABLE cameras DROP CONSTRAINT cameras_category_check;
  END IF;
END $$;

ALTER TABLE cameras ADD CONSTRAINT cameras_category_check
  CHECK (category IN ('camera','access_control','wifi','gate_barrier','speaker','data_sock','elv_room','smatv'));