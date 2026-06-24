// Локальная заглушка авторизации. Готова к замене на Supabase Auth.
import { useEffect, useState, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

const AUTH_KEY = "hg_auth_user";
const USERS_KEY = "hg_auth_users";

const isBrowser = typeof window !== "undefined";

function readUsers(): StoredUser[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      setUser(raw ? (JSON.parse(raw) as AuthUser) : null);
    } catch {
      setUser(null);
    }
    setReady(true);
    const handler = () => {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        setUser(raw ? (JSON.parse(raw) as AuthUser) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("hg-auth", handler);
    return () => window.removeEventListener("hg-auth", handler);
  }, []);

  const persist = (u: AuthUser | null) => {
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_KEY);
    setUser(u);
    window.dispatchEvent(new CustomEvent("hg-auth"));
  };

  const signUp = useCallback(
    (email: string, password: string, name?: string): { ok: boolean; error?: string; user?: AuthUser } => {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      if (!e || !p) return { ok: false, error: "Введите email и пароль" };
      const users = readUsers();
      if (users.some((u) => u.email === e))
        return { ok: false, error: "Пользователь с таким email уже зарегистрирован" };
      const u: StoredUser = { id: crypto.randomUUID(), email: e, password: p, name: name?.trim() };
      writeUsers([...users, u]);
      const pub: AuthUser = { id: u.id, email: u.email, name: u.name };
      persist(pub);
      return { ok: true, user: pub };
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string): { ok: boolean; error?: string; user?: AuthUser } => {
      const e = email.trim().toLowerCase();
      const p = password.trim();
      const found = readUsers().find((u) => u.email === e && u.password === p);
      if (!found) return { ok: false, error: "Неверный email или пароль" };
      const pub: AuthUser = { id: found.id, email: found.email, name: found.name };
      persist(pub);
      return { ok: true, user: pub };
    },
    [],
  );

  const resetPassword = useCallback(
    (email: string, newPassword: string): { ok: boolean; error?: string } => {
      const e = email.trim().toLowerCase();
      const p = newPassword.trim();
      if (!e || !p) return { ok: false, error: "Введите email и новый пароль" };
      const users = readUsers();
      const idx = users.findIndex((u) => u.email === e);
      if (idx === -1) return { ok: false, error: "Пользователь с таким email не найден" };
      users[idx] = { ...users[idx], password: p };
      writeUsers(users);
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(() => {
    persist(null);
  }, []);

  return { user, ready, signUp, signIn, signOut };
}
