// Заглушка авторизации. Подготовлена для подключения Supabase Auth.
// В дальнейшем: заменить локальное хранилище профиля/записей на таблицы Supabase
// и использовать `supabase.auth` вместо этого модуля.

import { useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

const AUTH_KEY = "hg_auth_user";

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
  }, []);

  const signIn = (u: AuthUser) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return { user, ready, signIn, signOut };
}
