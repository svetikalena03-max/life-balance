import type { DayEntry, Meal } from "./store";

const TEMPLATES_KEY = "hg_meal_templates_v1";

export type MealTemplate = {
  id: string;
  label: string;
  food: string;
  portion?: string;
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export function loadMealTemplates(): MealTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return DEFAULT_MEAL_TEMPLATES;
    const parsed = JSON.parse(raw) as MealTemplate[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MEAL_TEMPLATES;
  } catch {
    return DEFAULT_MEAL_TEMPLATES;
  }
}

export function saveMealTemplates(templates: MealTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function addMealTemplate(input: Omit<MealTemplate, "id">): MealTemplate[] {
  const next = [...loadMealTemplates(), { ...input, id: newId() }];
  saveMealTemplates(next);
  return next;
}

export function removeMealTemplate(id: string): MealTemplate[] {
  const next = loadMealTemplates().filter((t) => t.id !== id);
  saveMealTemplates(next);
  return next;
}

export const DEFAULT_MEAL_TEMPLATES: MealTemplate[] = [
  { id: "tpl-oatmeal", label: "Овсянка", food: "Овсянка с бананом", portion: "250 г" },
  { id: "tpl-omelet", label: "Омлет", food: "Омлет из 2 яиц", portion: "1 порция" },
  { id: "tpl-soup", label: "Суп", food: "Овощной суп", portion: "300 мл" },
  { id: "tpl-salad", label: "Салат", food: "Салат с курицей", portion: "200 г" },
  { id: "tpl-yogurt", label: "Йогурт", food: "Натуральный йогурт", portion: "150 г" },
];

export function yesterdayISO(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function cloneMealsForToday(meals: Meal[] | undefined): Meal[] {
  if (!meals?.length) return [];
  return meals.map((m) => ({
    ...m,
    id: newId(),
  }));
}

export type YesterdayCopyPayload = Pick<
  DayEntry,
  | "meals"
  | "water"
  | "tea"
  | "coffee"
  | "soda"
  | "juice"
  | "otherDrinks"
  | "sugar"
  | "sugarOther"
  | "milk"
  | "wellbeing"
  | "breadUnits"
  | "steps"
  | "workout"
  | "workoutMinutes"
  | "mood"
>;

export function extractYesterdayCopy(entry: DayEntry | undefined): YesterdayCopyPayload | null {
  if (!entry) return null;
  return {
    meals: cloneMealsForToday(entry.meals),
    water: entry.water,
    tea: entry.tea,
    coffee: entry.coffee,
    soda: entry.soda,
    juice: entry.juice,
    otherDrinks: entry.otherDrinks,
    sugar: entry.sugar,
    sugarOther: entry.sugarOther,
    milk: entry.milk,
    wellbeing: entry.wellbeing,
    breadUnits: entry.breadUnits,
    steps: entry.steps,
    workout: entry.workout,
    workoutMinutes: entry.workoutMinutes,
    mood: entry.mood,
  };
}
