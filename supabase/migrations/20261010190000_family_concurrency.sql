-- Existing function permissions are preserved by CREATE OR REPLACE.
BEGIN;

CREATE OR REPLACE FUNCTION public.create_family() RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE family UUID; current_user_id UUID := (SELECT auth.uid());
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  -- Serialize family creation and joining for this account across both RPCs.
  PERFORM 1 FROM auth.users WHERE id = current_user_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Leave your current family before creating a new one';
  END IF;
  INSERT INTO public.families (owner_user_id) VALUES (current_user_id)
  RETURNING id INTO family;
  RETURN family;
END; $$;

CREATE OR REPLACE FUNCTION public.create_family_invite(family UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invite UUID; current_user_id UUID := (SELECT auth.uid());
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  -- Lock the family before counting live codes so parallel requests share the cap.
  PERFORM 1 FROM public.families WHERE id = family AND owner_user_id = current_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the family owner can invite'; END IF;
  -- Limit unclaimed codes. A code is shown only once to the owner, is single use,
  -- and expires after seven days.
  IF (SELECT count(*) FROM public.family_invites WHERE family_id = family
      AND used_at IS NULL AND expires_at > now()) >= 20 THEN
    RAISE EXCEPTION 'Too many active invitations';
  END IF;
  INSERT INTO public.family_invites (family_id) VALUES (family) RETURNING code INTO invite;
  RETURN invite;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_code UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invite public.family_invites%ROWTYPE; current_user_id UUID := (SELECT auth.uid()); member_name TEXT;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  -- Serialize family creation and joining for this account across both RPCs.
  PERFORM 1 FROM auth.users WHERE id = current_user_id FOR UPDATE;
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

COMMIT;
