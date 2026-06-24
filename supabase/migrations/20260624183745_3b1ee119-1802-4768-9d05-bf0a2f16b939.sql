
-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  gender TEXT,
  birth_date DATE,
  age INTEGER,
  height NUMERIC,
  current_weight NUMERIC,
  target_weight NUMERIC,
  water_goal INTEGER,
  goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- DAILY ENTRIES
CREATE TABLE public.daily_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  breakfast_1 JSONB,
  breakfast_2 JSONB,
  snack JSONB,
  lunch JSONB,
  afternoon_snack JSONB,
  dinner JSONB,
  late_snack JSONB,
  extra_meals JSONB,
  water_ml INTEGER,
  tea_ml INTEGER,
  coffee_ml INTEGER,
  soda_ml INTEGER,
  juice_ml INTEGER,
  other_drinks TEXT,
  sugar TEXT,
  sugar_other TEXT,
  milk_or_cream BOOLEAN,
  bread_crisps_count NUMERIC,
  sleep_hours NUMERIC,
  mood INTEGER,
  steps INTEGER,
  workout TEXT,
  workout_minutes INTEGER,
  weight NUMERIC,
  wellbeing TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_entries TO authenticated;
GRANT ALL ON public.daily_entries TO service_role;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily select" ON public.daily_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own daily insert" ON public.daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily update" ON public.daily_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily delete" ON public.daily_entries FOR DELETE USING (auth.uid() = user_id);

-- HEALTH ENTRIES
CREATE TABLE public.health_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  systolic_pressure INTEGER,
  diastolic_pressure INTEGER,
  pulse INTEGER,
  energy INTEGER,
  swelling BOOLEAN,
  heartburn BOOLEAN,
  bloating BOOLEAN,
  back_pain BOOLEAN,
  knee_pain BOOLEAN,
  stress BOOLEAN,
  health_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_entries TO authenticated;
GRANT ALL ON public.health_entries TO service_role;
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own health select" ON public.health_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own health insert" ON public.health_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own health update" ON public.health_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own health delete" ON public.health_entries FOR DELETE USING (auth.uid() = user_id);

-- HABITS
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  smoking TEXT,
  vape TEXT,
  alcohol TEXT,
  coffee_per_day TEXT,
  coffee_ml INTEGER,
  tea_cups INTEGER,
  tea_ml INTEGER,
  tea_sugar TEXT,
  energy_drinks TEXT,
  sweets TEXT,
  fast_food TEXT,
  night_snacks TEXT,
  screen_time TEXT,
  stress_level TEXT,
  usual_steps INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits select" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own habits insert" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own habits update" ON public.habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own habits delete" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- HEALTH FEATURES
CREATE TABLE public.health_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  chronic_conditions TEXT[],
  chronic_other TEXT,
  movement_limitations TEXT[],
  gi_issues TEXT[],
  food_intolerances TEXT,
  women_health TEXT[],
  takes_meds BOOLEAN,
  medications TEXT,
  has_doctor_rec BOOLEAN,
  doctor_recommendations TEXT,
  workout_limits TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_features TO authenticated;
GRANT ALL ON public.health_features TO service_role;
ALTER TABLE public.health_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hf select" ON public.health_features FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own hf insert" ON public.health_features FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hf update" ON public.health_features FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hf delete" ON public.health_features FOR DELETE USING (auth.uid() = user_id);

-- LEGAL CONSENTS
CREATE TABLE public.legal_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  personal_data_accepted BOOLEAN NOT NULL DEFAULT false,
  user_agreement_accepted BOOLEAN NOT NULL DEFAULT false,
  medical_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  document_version TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_consents TO authenticated;
GRANT ALL ON public.legal_consents TO service_role;
ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents select" ON public.legal_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own consents insert" ON public.legal_consents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_daily_updated BEFORE UPDATE ON public.daily_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_health_updated BEFORE UPDATE ON public.health_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_hf_updated BEFORE UPDATE ON public.health_features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
