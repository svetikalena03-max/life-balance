import { useEffect, useState, useCallback } from "react";

export type Gender = "male" | "female" | "other";

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  currentWeight: number;
  targetWeight: number;
  waterGoal?: number;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  // Дневник
  food?: string;
  drinks?: string;
  wellbeing?: string;
  weight?: number;
  water?: number; // ml
  sleep?: number; // hours
  mood?: number; // 1-10
  breadUnits?: number; // хлебцы
  // Здоровье
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  energy?: number; // 1-10
  edema?: boolean;
  heartburn?: boolean;
  bloating?: boolean;
  backPain?: boolean;
  kneePain?: boolean;
  stress?: number; // 1-10
}

const PROFILE_KEY = "hg_profile";
const ENTRIES_KEY = "hg_entries_v2";
const LEGACY_ENTRIES_KEY = "hg_entries";

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("hg-storage", { detail: key }));
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfileState(read<Profile | null>(PROFILE_KEY, null));
    setReady(true);
    const handler = () => setProfileState(read<Profile | null>(PROFILE_KEY, null));
    window.addEventListener("hg-storage", handler);
    return () => window.removeEventListener("hg-storage", handler);
  }, []);

  const setProfile = useCallback((p: Profile) => {
    write(PROFILE_KEY, p);
    setProfileState(p);
  }, []);

  return { profile, setProfile, ready };
}

export function useEntries() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Migration: remove legacy demo entries
    if (isBrowser) {
      try { window.localStorage.removeItem(LEGACY_ENTRIES_KEY); } catch { /* noop */ }
    }
    setEntries(read<DayEntry[]>(ENTRIES_KEY, []));
    setReady(true);
    const handler = () => setEntries(read<DayEntry[]>(ENTRIES_KEY, []));
    window.addEventListener("hg-storage", handler);
    return () => window.removeEventListener("hg-storage", handler);
  }, []);

  const saveEntry = useCallback((patch: DayEntry) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === patch.date);
      const merged: DayEntry = { ...(existing ?? { date: patch.date }), ...patch };
      const filtered = prev.filter((e) => e.date !== patch.date);
      const next = [...filtered, merged].sort((a, b) => a.date.localeCompare(b.date));
      write(ENTRIES_KEY, next);
      return next;
    });
  }, []);

  return { entries, saveEntry, ready };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateRu(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
