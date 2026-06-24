import { useEffect, useState, useCallback } from "react";

export type Gender = "male" | "female" | "other";
export type Goal =
  | "lose"
  | "maintain"
  | "gain"
  | "health"
  | "pressure"
  | "sleep";

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Похудение",
  maintain: "Поддержание веса",
  gain: "Набор веса",
  health: "Улучшение здоровья",
  pressure: "Контроль давления",
  sleep: "Улучшение сна",
};

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  currentWeight: number;
  targetWeight: number;
  waterGoal?: number;
  birthDate?: string; // YYYY-MM-DD
  goal?: Goal;
}

export type MealType =
  | "breakfast1"
  | "breakfast2"
  | "snack1"
  | "lunch"
  | "snack2"
  | "dinner"
  | "lateSnack"
  | "extra";

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast1: "Завтрак 1",
  breakfast2: "Завтрак 2",
  snack1: "Перекус",
  lunch: "Обед",
  snack2: "Полдник",
  dinner: "Ужин",
  lateSnack: "Поздний перекус",
  extra: "Дополнительный приём",
};

export const DEFAULT_MEAL_TYPES: MealType[] = [
  "breakfast1",
  "breakfast2",
  "snack1",
  "lunch",
  "snack2",
  "dinner",
  "lateSnack",
];

export interface Meal {
  id: string;
  type: MealType;
  food?: string;
  portion?: string;
  time?: string; // HH:MM
  comment?: string;
}

export type SugarLevel = "none" | "one" | "two" | "other";
export const SUGAR_LABELS: Record<SugarLevel, string> = {
  none: "Без сахара",
  one: "1 ложка",
  two: "2 ложки",
  other: "Другое",
};

export interface DayEntry {
  date: string; // YYYY-MM-DD
  // Дневник — приёмы пищи
  meals?: Meal[];
  food?: string; // legacy, для старых записей
  // Напитки
  drinks?: string; // legacy
  water?: number; // ml
  tea?: number; // ml
  coffee?: number; // ml
  soda?: number; // ml
  juice?: number; // ml
  otherDrinks?: string;
  sugar?: SugarLevel;
  sugarOther?: string;
  milk?: boolean;
  // Прочее
  wellbeing?: string;
  weight?: number;
  sleep?: number;
  mood?: number;
  breadUnits?: number;
  steps?: number;
  workout?: string;
  workoutMinutes?: number;
  // Здоровье
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  energy?: number;
  edema?: boolean;
  heartburn?: boolean;
  bloating?: boolean;
  backPain?: boolean;
  kneePain?: boolean;
  stressed?: boolean;
  healthComment?: string;
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

export function formatDateWeekday(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
}
