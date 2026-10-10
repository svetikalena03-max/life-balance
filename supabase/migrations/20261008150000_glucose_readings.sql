-- Blood glucose measurements are private to the account that records them.
CREATE TABLE public.glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL,
  value_mmol_l NUMERIC(4,2) NOT NULL CHECK (value_mmol_l > 0 AND value_mmol_l <= 99.99),
  context TEXT NOT NULL CHECK (context IN ('fasting', 'before_meal', 'after_1h', 'after_2h', 'bedtime', 'other')),
  note TEXT NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX glucose_readings_owner_time_idx ON public.glucose_readings (user_id, measured_at DESC);
REVOKE ALL ON public.glucose_readings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glucose_readings TO authenticated;
GRANT ALL ON public.glucose_readings TO service_role;
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own glucose select" ON public.glucose_readings FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "own glucose insert" ON public.glucose_readings FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "own glucose update" ON public.glucose_readings FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "own glucose delete" ON public.glucose_readings FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);
