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
  food: string;
  drinks: string;
  wellbeing: string;
  weight: number;
  water: number; // ml
  sleep: number; // hours
  mood: number; // 1-10
}

const PROFILE_KEY = "hg_profile";
const ENTRIES_KEY = "hg_entries";

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

function demoEntries(): DayEntry[] {
  const today = new Date();
  const data: DayEntry[] = [];
  const samples = [
    { weight: 78.4, water: 1800, sleep: 7.5, mood: 8, food: "Овсянка, салат, курица с рисом", drinks: "Вода, зелёный чай", wellbeing: "Бодрость" },
    { weight: 78.1, water: 2100, sleep: 8, mood: 9, food: "Творог, суп, рыба с овощами", drinks: "Вода, кофе", wellbeing: "Отлично" },
    { weight: 78.3, water: 1500, sleep: 6.5, mood: 6, food: "Бутерброд, паста", drinks: "Вода, сок", wellbeing: "Немного устал" },
    { weight: 77.9, water: 2300, sleep: 8.2, mood: 9, food: "Йогурт, овощной салат, индейка", drinks: "Вода, морс", wellbeing: "Лёгкость" },
    { weight: 77.8, water: 2000, sleep: 7, mood: 7, food: "Каша, борщ, запеканка", drinks: "Вода, чай", wellbeing: "Норма" },
    { weight: 77.6, water: 2200, sleep: 7.8, mood: 8, food: "Омлет, греча с курицей, фрукты", drinks: "Вода, кефир", wellbeing: "Энергично" },
    { weight: 77.5, water: 1900, sleep: 7.2, mood: 8, food: "Творожник, лосось, овощи", drinks: "Вода, чай", wellbeing: "Хорошо" },
  ];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const s = samples[6 - i];
    data.push({ date: d.toISOString().slice(0, 10), ...s });
  }
  return data;
}

export function useEntries() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = read<DayEntry[] | null>(ENTRIES_KEY, null);
    if (!initial) {
      initial = demoEntries();
      write(ENTRIES_KEY, initial);
    }
    setEntries(initial);
    setReady(true);
    const handler = () => setEntries(read<DayEntry[]>(ENTRIES_KEY, []));
    window.addEventListener("hg-storage", handler);
    return () => window.removeEventListener("hg-storage", handler);
  }, []);

  const saveEntry = useCallback((entry: DayEntry) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      const next = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
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
