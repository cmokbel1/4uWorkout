-- Exercise catalogue only. No user data is ever stored here.

CREATE TABLE IF NOT EXISTS exercises (
  id                 text PRIMARY KEY,
  source             text NOT NULL,   -- 'exercisedb_pro' or '4u'
  name               text NOT NULL,
  body_part          text NOT NULL,
  target             text NOT NULL,
  equipment          text NOT NULL,
  difficulty         text NOT NULL,
  category           text NOT NULL,
  required_equipment text[] NOT NULL,
  data               jsonb NOT NULL   -- the full record, exactly as delivered
);

-- The only id the API exposes. The delivered ids are sequential, so serving
-- them would let a script walk the catalogue (EULA §13). Random per row, set
-- once: the import's upsert never touches it, so it survives re-imports.
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;

CREATE INDEX IF NOT EXISTS exercises_body_part_idx ON exercises (body_part);
CREATE INDEX IF NOT EXISTS exercises_target_idx ON exercises (target);

CREATE TABLE IF NOT EXISTS exercise_images (
  exercise_id  text PRIMARY KEY REFERENCES exercises (id) ON DELETE CASCADE,
  content_type text NOT NULL,
  image        bytea NOT NULL
);
