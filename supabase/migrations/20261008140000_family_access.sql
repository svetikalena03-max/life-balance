-- A family groups accounts for a future shared subscription. Health and diary
-- tables keep their existing owner-only RLS policies.
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.family_members (
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, user_id)
);
CREATE INDEX family_members_family_idx ON public.family_members (family_id);

CREATE TABLE public.family_invites (
  code UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX family_invites_family_idx ON public.family_invites (family_id);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.families, public.family_members, public.family_invites FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.families TO authenticated;
GRANT SELECT, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.families, public.family_members, public.family_invites TO service_role;

CREATE POLICY "owner reads family" ON public.families FOR SELECT TO authenticated
USING (owner_user_id = (SELECT auth.uid()));
CREATE POLICY "owner deletes family" ON public.families FOR DELETE TO authenticated
USING (owner_user_id = (SELECT auth.uid()));
CREATE POLICY "member or owner reads membership" ON public.family_members FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_user_id = (SELECT auth.uid())
));
CREATE POLICY "member or owner removes membership" ON public.family_members FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_user_id = (SELECT auth.uid())
));
-- Invitations are accessible only through the functions below; clients cannot
-- list codes or choose the family_id of a new membership.

CREATE FUNCTION public.create_family() RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE family UUID; current_user_id UUID := (SELECT auth.uid());
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Leave your current family before creating a new one';
  END IF;
  INSERT INTO public.families (owner_user_id) VALUES (current_user_id)
  RETURNING id INTO family;
  RETURN family;
END; $$;

CREATE FUNCTION public.create_family_invite(family UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invite UUID; current_user_id UUID := (SELECT auth.uid());
BEGIN
  IF current_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.families WHERE id = family AND owner_user_id = current_user_id
  ) THEN RAISE EXCEPTION 'Only the family owner can invite'; END IF;
  -- Limit unclaimed codes. A code is shown only once to the owner, is single use,
  -- and expires after seven days.
  IF (SELECT count(*) FROM public.family_invites WHERE family_id = family
      AND used_at IS NULL AND expires_at > now()) >= 20 THEN
    RAISE EXCEPTION 'Too many active invitations';
  END IF;
  INSERT INTO public.family_invites (family_id) VALUES (family) RETURNING code INTO invite;
  RETURN invite;
END; $$;

CREATE FUNCTION public.accept_family_invite(invite_code UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invite public.family_invites%ROWTYPE; current_user_id UUID := (SELECT auth.uid()); member_name TEXT;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF EXISTS (SELECT 1 FROM public.families WHERE owner_user_id = current_user_id) OR
     EXISTS (SELECT 1 FROM public.family_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Account is already in a family';
  END IF;
  SELECT * INTO invite FROM public.family_invites WHERE code = invite_code FOR UPDATE;
  IF NOT FOUND OR invite.used_at IS NOT NULL OR invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation is invalid or expired';
  END IF;
  SELECT nullif(btrim(name), '') INTO member_name FROM public.profiles WHERE user_id = current_user_id;
  INSERT INTO public.family_members (family_id, user_id, display_name)
  VALUES (invite.family_id, current_user_id, left(coalesce(member_name, 'Участник'), 100));
  UPDATE public.family_invites SET used_at = now(), used_by = current_user_id WHERE code = invite_code;
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.create_family() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_family_invite(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_family_invite(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_family() FROM anon;
REVOKE ALL ON FUNCTION public.create_family_invite(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accept_family_invite(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_family() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_family_invite(UUID) TO authenticated;
