-- Personal recipes are private to the account that created them.
CREATE TABLE public.user_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  ingredients JSONB NOT NULL CHECK (jsonb_typeof(ingredients) = 'array' AND jsonb_array_length(ingredients) BETWEEN 1 AND 30),
  steps JSONB NOT NULL CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) BETWEEN 1 AND 20),
  photo_path TEXT CHECK (photo_path IS NULL OR (char_length(photo_path) <= 300 AND photo_path LIKE user_id::text || '/%')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_recipes_owner_created_idx ON public.user_recipes (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_recipes TO authenticated;
GRANT ALL ON public.user_recipes TO service_role;
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recipes select" ON public.user_recipes FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "own recipes insert" ON public.user_recipes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "own recipes update" ON public.user_recipes FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "own recipes delete" ON public.user_recipes FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('personal-recipe-photos', 'personal-recipe-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own recipe photos select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'personal-recipe-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "own recipe photos insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'personal-recipe-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "own recipe photos delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'personal-recipe-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
