import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export interface Habits {
  smoking?: "no" | "sometimes" | "daily";
  vape?: "no" | "sometimes" | "daily";
  alcohol?: "no" | "rare" | "weekly" | "often";
  coffeeFreq?: "no" | "one" | "two" | "three_plus";
  coffeeMl?: number;
  teaCups?: number;
  teaMl?: number;
  teaSugar?: "with" | "without";
  energyDrinks?: "no" | "sometimes" | "regular";
  sweets?: "no" | "sometimes" | "daily";
  fastfood?: "no" | "sometimes" | "often";
  nightSnacks?: "no" | "sometimes" | "often";
  stressLevel?: "low" | "medium" | "high";
  screenTime?: "lt4" | "4to8" | "gt8";
  dailySteps?: number;
}

export const CHRONIC_OPTIONS = [
  ["none", "Нет хронических заболеваний"],
  ["gastritis", "Гастрит"],
  ["pancreatitis", "Панкреатит"],
  ["gerd", "ГЭРБ / изжога"],
  ["diabetes", "Диабет"],
  ["insulin_res", "Инсулинорезистентность"],
  ["hypertension", "Гипертония"],
  ["hypotension", "Пониженное давление"],
  ["varicose", "Варикоз"],
  ["edema", "Отёки"],
  ["thyroid", "Заболевания щитовидной железы"],
  ["heart", "Заболевания сердца"],
  ["kidney", "Заболевания почек"],
  ["liver", "Заболевания печени"],
  ["anemia", "Анемия"],
  ["migraine", "Мигрень"],
  ["other", "Другое"],
] as const;

export const MUSCULO_OPTIONS = [
  ["back", "Боль в спине"],
  ["lowerback", "Боль в пояснице"],
  ["neck", "Боль в шее"],
  ["knees", "Боль в коленях"],
  ["joints", "Боль в суставах"],
  ["mobility", "Ограничение подвижности"],
  ["trauma", "После травмы"],
  ["other", "Другое"],
] as const;

export const GI_OPTIONS = [
  ["bloating", "Вздутие"],
  ["heartburn", "Изжога"],
  ["heaviness", "Тяжесть после еды"],
  ["constipation", "Запоры"],
  ["diarrhea", "Диарея"],
  ["lactose", "Непереносимость молочных продуктов"],
  ["gluten", "Непереносимость глютена"],
  ["allergy", "Аллергия на продукты"],
] as const;

export const WOMEN_OPTIONS = [
  ["na", "Не актуально"],
  ["regular", "Регулярный цикл"],
  ["irregular", "Нерегулярный цикл"],
  ["perimenopause", "Перименопауза"],
  ["menopause", "Менопауза"],
  ["pregnancy", "Беременность"],
  ["postpartum", "После родов"],
  ["skip", "Не хочу указывать"],
] as const;

export const TRAINING_OPTIONS = [
  ["nojump", "Нельзя прыгать"],
  ["norun", "Нельзя бегать"],
  ["nostrength", "Нельзя силовые нагрузки"],
  ["nobend", "Нельзя наклоны"],
  ["nostand", "Нельзя долго стоять"],
  ["soft", "Нужны мягкие тренировки"],
  ["walkonly", "Только ходьба"],
  ["lfk", "Только ЛФК"],
  ["other", "Другое"],
] as const;

export interface HealthFeatures {
  chronic?: string[];
  chronicOther?: string;
  musculo?: string[];
  gi?: string[];
  giIntolerances?: string;
  women?: string[];
  takesMeds?: boolean;
  medsList?: string;
  hasDoctorRec?: boolean;
  doctorRec?: string;
  training?: string[];
  comment?: string;
}

export function summarizeHealthFeatures(hf?: HealthFeatures): string {
  if (!hf) return "Не заполнено";
  const labels: string[] = [];
  const pick = (
    arr: string[] | undefined,
    src: ReadonlyArray<readonly [string, string]>,
    skip: string[] = [],
  ) => {
    (arr ?? []).forEach((v) => {
      if (skip.includes(v)) return;
      const found = src.find(([k]) => k === v);
      if (found) labels.push(found[1]);
    });
  };
  pick(hf.chronic, CHRONIC_OPTIONS, ["none", "other"]);
  pick(hf.musculo, MUSCULO_OPTIONS, ["other"]);
  pick(hf.gi, GI_OPTIONS);
  if (!labels.length) return "Не заполнено";
  const first = labels.slice(0, 3).join(", ");
  return labels.length > 3 ? `${first} +${labels.length - 3}` : first;
}

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  currentWeight: number;
  targetWeight: number;
  waterGoal?: number;
  birthDate?: string;
  goal?: Goal;
  habits?: Habits;
  healthFeatures?: HealthFeatures;
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
  time?: string;
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
  date: string;
  meals?: Meal[];
  food?: string;
  drinks?: string;
  water?: number;
  tea?: number;
  coffee?: number;
  soda?: number;
  juice?: number;
  otherDrinks?: string;
  sugar?: SugarLevel;
  sugarOther?: string;
  milk?: boolean;
  wellbeing?: string;
  weight?: number;
  sleep?: number;
  mood?: number;
  breadUnits?: number;
  steps?: number;
  workout?: string;
  workoutMinutes?: number;
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

// ============ helpers ============

const MEAL_COL: Record<Exclude<MealType, "extra">, string> = {
  breakfast1: "breakfast_1",
  breakfast2: "breakfast_2",
  snack1: "snack",
  lunch: "lunch",
  snack2: "afternoon_snack",
  dinner: "dinner",
  lateSnack: "late_snack",
};

function rowToProfile(p: any, h: any, hf: any): Profile {
  return {
    name: p?.name ?? "",
    age: p?.age ?? 0,
    gender: (p?.gender as Gender) ?? "female",
    height: Number(p?.height) || 0,
    currentWeight: Number(p?.current_weight) || 0,
    targetWeight: Number(p?.target_weight) || 0,
    waterGoal: p?.water_goal ?? undefined,
    birthDate: p?.birth_date ?? undefined,
    goal: (p?.goal as Goal) ?? undefined,
    habits: h ? {
      smoking: h.smoking ?? undefined,
      vape: h.vape ?? undefined,
      alcohol: h.alcohol ?? undefined,
      coffeeFreq: h.coffee_per_day ?? undefined,
      coffeeMl: h.coffee_ml ?? undefined,
      teaCups: h.tea_cups ?? undefined,
      teaMl: h.tea_ml ?? undefined,
      teaSugar: h.tea_sugar ?? undefined,
      energyDrinks: h.energy_drinks ?? undefined,
      sweets: h.sweets ?? undefined,
      fastfood: h.fast_food ?? undefined,
      nightSnacks: h.night_snacks ?? undefined,
      stressLevel: h.stress_level ?? undefined,
      screenTime: h.screen_time ?? undefined,
      dailySteps: h.usual_steps ?? undefined,
    } : undefined,
    healthFeatures: hf ? {
      chronic: hf.chronic_conditions ?? undefined,
      chronicOther: hf.chronic_other ?? undefined,
      musculo: hf.movement_limitations ?? undefined,
      gi: hf.gi_issues ?? undefined,
      giIntolerances: hf.food_intolerances ?? undefined,
      women: hf.women_health ?? undefined,
      takesMeds: hf.takes_meds ?? undefined,
      medsList: hf.medications ?? undefined,
      hasDoctorRec: hf.has_doctor_rec ?? undefined,
      doctorRec: hf.doctor_recommendations ?? undefined,
      training: hf.workout_limits ?? undefined,
      comment: hf.comment ?? undefined,
    } : undefined,
  };
}

function dailyRowToEntry(d: any): Partial<DayEntry> {
  const meals: Meal[] = [];
  (Object.keys(MEAL_COL) as Exclude<MealType, "extra">[]).forEach((t) => {
    const v = d[MEAL_COL[t]];
    if (v && typeof v === "object") meals.push({ ...(v as Meal), type: t });
  });
  if (Array.isArray(d.extra_meals)) {
    d.extra_meals.forEach((m: Meal) => meals.push({ ...m, type: "extra" }));
  }
  return {
    date: d.date,
    meals: meals.length ? meals : undefined,
    water: d.water_ml ?? undefined,
    tea: d.tea_ml ?? undefined,
    coffee: d.coffee_ml ?? undefined,
    soda: d.soda_ml ?? undefined,
    juice: d.juice_ml ?? undefined,
    otherDrinks: d.other_drinks ?? undefined,
    sugar: d.sugar ?? undefined,
    sugarOther: d.sugar_other ?? undefined,
    milk: d.milk_or_cream ?? undefined,
    breadUnits: d.bread_crisps_count ?? undefined,
    sleep: d.sleep_hours ?? undefined,
    mood: d.mood ?? undefined,
    steps: d.steps ?? undefined,
    workout: d.workout ?? undefined,
    workoutMinutes: d.workout_minutes ?? undefined,
    weight: d.weight ?? undefined,
    wellbeing: d.wellbeing ?? undefined,
  };
}

function healthRowToEntry(h: any): Partial<DayEntry> {
  return {
    date: h.date,
    systolic: h.systolic_pressure ?? undefined,
    diastolic: h.diastolic_pressure ?? undefined,
    pulse: h.pulse ?? undefined,
    energy: h.energy ?? undefined,
    edema: h.swelling ?? undefined,
    heartburn: h.heartburn ?? undefined,
    bloating: h.bloating ?? undefined,
    backPain: h.back_pain ?? undefined,
    kneePain: h.knee_pain ?? undefined,
    stressed: h.stress ?? undefined,
    healthComment: h.health_comment ?? undefined,
  };
}

function entryToDailyRow(e: DayEntry, userId: string) {
  const row: Record<string, any> = { user_id: userId, date: e.date };
  if (e.meals) {
    (Object.keys(MEAL_COL) as Exclude<MealType, "extra">[]).forEach((t) => {
      row[MEAL_COL[t]] = null;
    });
    const extras: Meal[] = [];
    e.meals.forEach((m) => {
      if (m.type === "extra") extras.push(m);
      else row[MEAL_COL[m.type]] = m;
    });
    row.extra_meals = extras;
  }
  const map: Array<[keyof DayEntry, string]> = [
    ["water", "water_ml"], ["tea", "tea_ml"], ["coffee", "coffee_ml"],
    ["soda", "soda_ml"], ["juice", "juice_ml"], ["otherDrinks", "other_drinks"],
    ["sugar", "sugar"], ["sugarOther", "sugar_other"], ["milk", "milk_or_cream"],
    ["breadUnits", "bread_crisps_count"], ["sleep", "sleep_hours"],
    ["mood", "mood"], ["steps", "steps"], ["workout", "workout"],
    ["workoutMinutes", "workout_minutes"], ["weight", "weight"], ["wellbeing", "wellbeing"],
  ];
  map.forEach(([k, c]) => { if (e[k] !== undefined) row[c] = e[k]; });
  return row;
}

function entryToHealthRow(e: DayEntry, userId: string) {
  const row: Record<string, any> = { user_id: userId, date: e.date };
  const map: Array<[keyof DayEntry, string]> = [
    ["systolic", "systolic_pressure"], ["diastolic", "diastolic_pressure"],
    ["pulse", "pulse"], ["energy", "energy"], ["edema", "swelling"],
    ["heartburn", "heartburn"], ["bloating", "bloating"], ["backPain", "back_pain"],
    ["kneePain", "knee_pain"], ["stressed", "stress"], ["healthComment", "health_comment"],
  ];
  let has = false;
  map.forEach(([k, c]) => { if (e[k] !== undefined) { row[c] = e[k]; has = true; } });
  return has ? row : null;
}

function profileToRow(p: Profile, userId: string) {
  return {
    user_id: userId,
    name: p.name,
    age: p.age,
    gender: p.gender,
    height: p.height,
    current_weight: p.currentWeight,
    target_weight: p.targetWeight,
    water_goal: p.waterGoal ?? null,
    birth_date: p.birthDate ?? null,
    goal: p.goal ?? null,
  };
}

function habitsToRow(h: Habits, userId: string) {
  return {
    user_id: userId,
    smoking: h.smoking ?? null,
    vape: h.vape ?? null,
    alcohol: h.alcohol ?? null,
    coffee_per_day: h.coffeeFreq ?? null,
    coffee_ml: h.coffeeMl ?? null,
    tea_cups: h.teaCups ?? null,
    tea_ml: h.teaMl ?? null,
    tea_sugar: h.teaSugar ?? null,
    energy_drinks: h.energyDrinks ?? null,
    sweets: h.sweets ?? null,
    fast_food: h.fastfood ?? null,
    night_snacks: h.nightSnacks ?? null,
    stress_level: h.stressLevel ?? null,
    screen_time: h.screenTime ?? null,
    usual_steps: h.dailySteps ?? null,
  };
}

function hfToRow(hf: HealthFeatures, userId: string) {
  return {
    user_id: userId,
    chronic_conditions: hf.chronic ?? null,
    chronic_other: hf.chronicOther ?? null,
    movement_limitations: hf.musculo ?? null,
    gi_issues: hf.gi ?? null,
    food_intolerances: hf.giIntolerances ?? null,
    women_health: hf.women ?? null,
    takes_meds: hf.takesMeds ?? null,
    medications: hf.medsList ?? null,
    has_doctor_rec: hf.hasDoctorRec ?? null,
    doctor_recommendations: hf.doctorRec ?? null,
    workout_limits: hf.training ?? null,
    comment: hf.comment ?? null,
  };
}

// ============ hooks ============

function useUserId() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUid(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return uid;
}

export function useProfile() {
  const uid = useUserId();
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async (userId: string) => {
    const [{ data: p }, { data: h }, { data: hf }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("habits").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("health_features").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setProfileState(p ? rowToProfile(p, h, hf) : null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!uid) { setProfileState(null); setReady(true); return; }
    setReady(false);
    reload(uid);
  }, [uid, reload]);

  const setProfile = useCallback(async (p: Profile) => {
    if (!uid) return;
    setProfileState(p);
    await supabase.from("profiles").upsert(profileToRow(p, uid), { onConflict: "user_id" });
    if (p.habits) {
      await supabase.from("habits").upsert(habitsToRow(p.habits, uid), { onConflict: "user_id" });
    }
    if (p.healthFeatures) {
      await supabase.from("health_features").upsert(hfToRow(p.healthFeatures, uid), { onConflict: "user_id" });
    }
  }, [uid]);

  return { profile, setProfile, ready };
}

export function useEntries() {
  const uid = useUserId();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [ready, setReady] = useState(false);
  const uidRef = useRef<string | null>(null);
  uidRef.current = uid;

  useEffect(() => {
    if (!uid) { setEntries([]); setReady(true); return; }
    setReady(false);
    (async () => {
      const [{ data: daily }, { data: health }] = await Promise.all([
        supabase.from("daily_entries").select("*").eq("user_id", uid).order("date"),
        supabase.from("health_entries").select("*").eq("user_id", uid).order("date"),
      ]);
      const byDate = new Map<string, DayEntry>();
      (daily ?? []).forEach((d: any) => {
        const e = dailyRowToEntry(d) as DayEntry;
        byDate.set(e.date, { ...(byDate.get(e.date) ?? { date: e.date }), ...e });
      });
      (health ?? []).forEach((h: any) => {
        const e = healthRowToEntry(h) as DayEntry;
        byDate.set(e.date, { ...(byDate.get(e.date) ?? { date: e.date }), ...e });
      });
      setEntries(Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)));
      setReady(true);
    })();
  }, [uid]);

  const saveEntry = useCallback(async (patch: DayEntry) => {
    const userId = uidRef.current;
    if (!userId) return;
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === patch.date);
      const merged: DayEntry = { ...(existing ?? { date: patch.date }), ...patch };
      const filtered = prev.filter((e) => e.date !== patch.date);
      return [...filtered, merged].sort((a, b) => a.date.localeCompare(b.date));
    });
    const dailyRow = entryToDailyRow(patch, userId);
    const healthRow = entryToHealthRow(patch, userId);
    const ops: PromiseLike<unknown>[] = [];
    if (Object.keys(dailyRow).length > 2) {
      ops.push(supabase.from("daily_entries").upsert(dailyRow as any, { onConflict: "user_id,date" }));
    }
    if (healthRow) {
      ops.push(supabase.from("health_entries").upsert(healthRow as any, { onConflict: "user_id,date" }));
    }
    await Promise.all(ops);
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
