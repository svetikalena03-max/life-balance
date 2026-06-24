// Авторизация через Lovable Cloud (Supabase Auth).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  code?: string;
  user?: AuthUser | null;
}

function toAuthUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const name = (meta.name as string | undefined) ?? (meta.full_name as string | undefined);
  return { id: u.id, email: u.email ?? "", name };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(toAuthUser(data.session?.user ?? null));
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string): Promise<AuthResult> => {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      if (!e || !p) return { ok: false, error: "Введите email и пароль" };
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password: p,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: name ? { name: name.trim() } : {},
        },
      });
      if (error) {
        console.error("Supabase Auth signUp error", {
          message: error.message,
          code: error.code,
          status: error.status,
          name: error.name,
        });
        return { ok: false, error: error.message, code: error.code };
      }
      let session = data.session;
      let signedUser = data.user;
      if (!session) {
        const retry = await supabase.auth.signInWithPassword({ email: e, password: p });
        if (retry.error) {
          console.error("Supabase Auth signInWithPassword after signUp error", {
            email: e,
            message: retry.error.message,
            code: retry.error.code,
            status: retry.error.status,
            name: retry.error.name,
          });
          return { ok: false, error: retry.error.message, code: retry.error.code };
        }
        session = retry.data.session;
        signedUser = retry.data.user;
      }
      console.info("Supabase Auth signUp success", {
        userId: signedUser?.id,
        email: signedUser?.email,
        hasSession: Boolean(session),
        emailConfirmedAt: signedUser?.email_confirmed_at,
      });
      return { ok: true, user: toAuthUser(signedUser) };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });
      if (error) {
        console.error("Supabase Auth signInWithPassword error", {
          email: e,
          message: error.message,
          code: error.code,
          status: error.status,
          name: error.name,
        });
        return { ok: false, error: error.message, code: error.code };
      }
      console.info("Supabase Auth signInWithPassword success", {
        userId: data.user?.id,
        email: data.user?.email,
        hasSession: Boolean(data.session),
      });
      return { ok: true, user: toAuthUser(data.user) };
    },
    [],
  );

  const resetPassword = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      const e = email.trim().toLowerCase();
      if (!e) return { ok: false, error: "Введите email" };
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        console.error("Supabase Auth resetPasswordForEmail error", {
          email: e,
          message: error.message,
          code: error.code,
          status: error.status,
          name: error.name,
        });
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, ready, signUp, signIn, signOut, resetPassword };
}
