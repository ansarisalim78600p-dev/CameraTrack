/*
# Add Fluke Test stage to all device categories

1. Existing table changes
- `cameras.fluke_test`: new stage column with pending, in_progress, or complete status.
  Placed logically between Termination and Device Installation in the stage workflow.

2. Data preservation
- Existing rows remain in place with all their current values untouched.
- New column defaults to 'pending' so existing items start with a pending Fluke Test.

3. Security
- Existing RLS policies on `cameras` remain active and already cover the added column
  for this single-tenant app.

4. Important notes
- This migration is additive and idempotent.
- No rows or columns are deleted or renamed.
*/

ALTER TABLE cameras ADD COLUMN IF NOT EXISTS fluke_test text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cameras_fluke_test_check') THEN
    ALTER TABLE cameras ADD CONSTRAINT cameras_fluke_test_check CHECK (fluke_test IN ('pending','in_progress','complete'));
  END IF;
END $$;