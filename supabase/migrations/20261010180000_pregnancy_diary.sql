BEGIN;

CREATE TABLE public.pregnancy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pregnancy_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('daily', 'visit')),
  weight_kg NUMERIC(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
  systolic INTEGER CHECK (systolic BETWEEN 1 AND 400),
  diastolic INTEGER CHECK (diastolic BETWEEN 1 AND 400),
  note TEXT NOT NULL DEFAULT '' CHECK (char_length(note) <= 2000),
  recommendations TEXT NOT NULL DEFAULT '' CHECK (char_length(recommendations) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((systolic IS NULL) = (diastolic IS NULL))
);
CREATE INDEX pregnancy_records_owner_date_idx ON public.pregnancy_records (user_id, record_date DESC);

ALTER TABLE public.pregnancy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pregnancy_settings, public.pregnancy_records FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregnancy_settings, public.pregnancy_records TO authenticated;
GRANT ALL ON public.pregnancy_settings, public.pregnancy_records TO service_role;

CREATE POLICY "own pregnancy settings" ON public.pregnancy_settings
FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "own pregnancy records" ON public.pregnancy_records
FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
