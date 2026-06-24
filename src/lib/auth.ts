// Авторизация через Lovable Cloud (Supabase Auth).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
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
    async (email: string, password: string, name?: string): Promise<{ ok: boolean; error?: string }> => {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      if (!e || !p) return { ok: false, error: "Введите email и пароль" };
      const { error } = await supabase.auth.signUp({
        email: e,
        password: p,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: name ? { name: name.trim() } : {},
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("registered") || msg.includes("exists"))
          return { ok: false, error: "Пользователь с таким email уже зарегистрирован" };
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (error) return { ok: false, error: "Неверный email или пароль" };
      return { ok: true };
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
      if (error) return { ok: false, error: error.message };
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
