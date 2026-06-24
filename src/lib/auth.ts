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
  serverError?: string;
  code?: string;
  user?: AuthUser | null;
}

const EXISTING_USER_MESSAGE = "Пользователь с таким email уже зарегистрирован. Попробуйте войти или восстановить пароль.";
const LOGIN_FAILED_MESSAGE = "Не удалось войти. Проверьте email и пароль. Если вы уже регистрировались несколько раз, попробуйте восстановить пароль или создать новый тестовый аккаунт.";

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

function isExistingUserError(message?: string, code?: string) {
  const text = `${message ?? ""} ${code ?? ""}`.toLowerCase();
  return text.includes("already") || text.includes("registered") || text.includes("user_already_exists");
}

function isInvalidCredentialsError(message?: string, code?: string) {
  const text = `${message ?? ""} ${code ?? ""}`.toLowerCase();
  return text.includes("invalid login credentials") || text.includes("invalid_credentials");
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
      const e = normalizeAuthEmail(email);
      const p = password;
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
        if (isExistingUserError(error.message, error.code)) {
          return { ok: false, error: EXISTING_USER_MESSAGE, serverError: error.message, code: error.code };
        }
        return { ok: false, error: error.message, code: error.code };
      }
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        console.warn("Supabase Auth signUp existing user response", { email: e, userId: data.user.id });
        return { ok: false, error: EXISTING_USER_MESSAGE, serverError: "User already registered", code: "user_already_exists" };
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
          if (isInvalidCredentialsError(retry.error.message, retry.error.code)) {
            return { ok: false, error: LOGIN_FAILED_MESSAGE, serverError: retry.error.message, code: retry.error.code };
          }
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
      const e = normalizeAuthEmail(email);
      const p = password;
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
        if (isInvalidCredentialsError(error.message, error.code)) {
          return { ok: false, error: LOGIN_FAILED_MESSAGE, serverError: error.message, code: error.code };
        }
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
      const e = normalizeAuthEmail(email);
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
