import { z } from "zod";
import type { DayEntry, MealType, SugarLevel } from "./store";

/** Частичная запись дня без date — для извлечения AI перед сохранением. */
export type DayEntryExtract = Partial<Omit<DayEntry, "date">>;

export const NOT_SPECIFIED = "не указано";

const MEAL_TYPES = [
  "breakfast1",
  "breakfast2",
  "snack1",
  "lunch",
  "snack2",
  "dinner",
  "lateSnack",
  "extra",
] as const satisfies readonly MealType[];

const MEAL_TYPE_ALIASES: Record<string, MealType> = {
  breakfast: "breakfast1",
  breakfast1: "breakfast1",
  breakfast2: "breakfast2",
  snack: "snack1",
  snack1: "snack1",
  snack2: "snack2",
  lunch: "lunch",
  dinner: "dinner",
  latesnack: "lateSnack",
  late_snack: "lateSnack",
  extra: "extra",
  завтрак: "breakfast1",
  обед: "lunch",
  ужин: "dinner",
  перекус: "snack1",
  полдник: "snack2",
};

function toOptionalString(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

function normalizeMealType(raw: unknown): MealType | undefined {
  if (typeof raw !== "string") return undefined;
  const key = raw.trim().toLowerCase().replace(/[\s-]/g, "");
  if (MEAL_TYPE_ALIASES[key]) return MEAL_TYPE_ALIASES[key];
  return MEAL_TYPES.includes(raw as MealType) ? (raw as MealType) : undefined;
}

function coercedOptionalNumber(opts?: { int?: boolean; min?: number; max?: number }) {
  return z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val): number | undefined => {
      if (val === null || val === undefined) return undefined;
      const str = String(val).trim().replace(",", ".");
      if (!str) return undefined;
      const n = opts?.int ? Number.parseInt(str, 10) : Number.parseFloat(str);
      if (!Number.isFinite(n)) return undefined;
      if (opts?.min !== undefined && n < opts.min) return undefined;
      if (opts?.max !== undefined && n > opts.max) return undefined;
      return n;
    });
}

function coercedOptionalBoolean() {
  return z
    .union([z.boolean(), z.string(), z.number(), z.null()])
    .optional()
    .transform((val): boolean | undefined => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val !== 0;
      const s = String(val).trim().toLowerCase();
      if (["true", "yes", "да", "1"].includes(s)) return true;
      if (["false", "no", "нет", "0"].includes(s)) return false;
      return undefined;
    });
}

const sugarLevelSchema = z
  .union([z.enum(["none", "one", "two", "other"]), z.string(), z.null()])
  .optional()
  .transform((val): SugarLevel | undefined => {
    if (val === null || val === undefined) return undefined;
    if (val === "none" || val === "one" || val === "two" || val === "other") return val;
    const v = String(val).trim().toLowerCase();
    if (v === "none" || v === "one" || v === "two" || v === "other") return v;
    return undefined;
  });

export const aiMealSchema = z
  .object({
    type: z.preprocess(normalizeMealType, z.enum(MEAL_TYPES).optional()),
    food: z.preprocess(toOptionalString, z.string().optional()),
    portion: z.preprocess(toOptionalString, z.string().optional()),
    time: z.preprocess(toOptionalString, z.string().optional()),
    comment: z.preprocess(toOptionalString, z.string().optional()),
  })
  .transform((meal) => {
    if (!meal.food && !meal.portion && !meal.time && !meal.comment) return null;
    return meal;
  });

/** Zod-схема structured-полей, совместимых с DayEntry (без date). */
export const dayEntryExtractSchema = z
  .object({
    meals: z.array(aiMealSchema).optional(),
    water: coercedOptionalNumber({ int: true, min: 0 }),
    tea: coercedOptionalNumber({ int: true, min: 0 }),
    coffee: coercedOptionalNumber({ int: true, min: 0 }),
    soda: coercedOptionalNumber({ int: true, min: 0 }),
    juice: coercedOptionalNumber({ int: true, min: 0 }),
    otherDrinks: z.preprocess(toOptionalString, z.string().optional()),
    sugar: sugarLevelSchema,
    sugarOther: z.preprocess(toOptionalString, z.string().optional()),
    milk: coercedOptionalBoolean(),
    wellbeing: z.preprocess(toOptionalString, z.string().optional()),
    weight: coercedOptionalNumber({ min: 0 }),
    sleep: coercedOptionalNumber({ min: 0, max: 24 }),
    mood: coercedOptionalNumber({ int: true, min: 1, max: 10 }),
    breadUnits: coercedOptionalNumber({ min: 0 }),
    steps: coercedOptionalNumber({ int: true, min: 0 }),
    workout: z.preprocess(toOptionalString, z.string().optional()),
    workoutMinutes: coercedOptionalNumber({ int: true, min: 0 }),
    systolic: coercedOptionalNumber({ int: true, min: 50, max: 250 }),
    diastolic: coercedOptionalNumber({ int: true, min: 30, max: 150 }),
    pulse: coercedOptionalNumber({ int: true, min: 30, max: 220 }),
    energy: coercedOptionalNumber({ int: true, min: 1, max: 10 }),
    edema: coercedOptionalBoolean(),
    heartburn: coercedOptionalBoolean(),
    bloating: coercedOptionalBoolean(),
    backPain: coercedOptionalBoolean(),
    kneePain: coercedOptionalBoolean(),
    stressed: coercedOptionalBoolean(),
    healthComment: z.preprocess(toOptionalString, z.string().optional()),
  })
  .strip()
  .transform((entry) => {
    const meals = entry.meals?.filter((m): m is NonNullable<typeof m> => m !== null);
    const cleaned: DayEntryExtract = {};

    if (meals && meals.length > 0) cleaned.meals = meals;
    for (const [key, value] of Object.entries(entry)) {
      if (key === "meals") continue;
      if (value !== undefined && value !== null) {
        (cleaned as Record<string, unknown>)[key] = value;
      }
    }
    return cleaned;
  });

export type DayTextDisplay = {
  nutrition: string;
  water: string;
  otherDrinks: string;
  sleep: string;
  pressure: string;
  mood: string;
  wellbeing: string;
  advice: string;
};

export const DAY_TEXT_DISPLAY_FIELDS = [
  "nutrition",
  "water",
  "otherDrinks",
  "sleep",
  "pressure",
  "mood",
  "wellbeing",
  "advice",
] as const satisfies ReadonlyArray<keyof DayTextDisplay>;

const dayTextDisplayFieldSchema = z.preprocess(
  (val) => (typeof val === "string" && val.trim().length > 0 ? val.trim() : NOT_SPECIFIED),
  z.string(),
);

export const dayTextDisplaySchema = z.object({
  nutrition: dayTextDisplayFieldSchema,
  water: dayTextDisplayFieldSchema,
  otherDrinks: dayTextDisplayFieldSchema,
  sleep: dayTextDisplayFieldSchema,
  pressure: dayTextDisplayFieldSchema,
  mood: dayTextDisplayFieldSchema,
  wellbeing: dayTextDisplayFieldSchema,
  advice: dayTextDisplayFieldSchema,
});

/** Сырой JSON от OpenAI до нормализации. */
export const rawAnalyzeDayTextResponseSchema = z
  .object({
    nutrition: z.unknown().optional(),
    water: z.unknown().optional(),
    otherDrinks: z.unknown().optional(),
    sleep: z.unknown().optional(),
    pressure: z.unknown().optional(),
    mood: z.unknown().optional(),
    wellbeing: z.unknown().optional(),
    advice: z.unknown().optional(),
    entry: z.unknown().optional(),
  })
  .passthrough();

export type ParsedAnalyzeDayText = {
  display: DayTextDisplay;
  structured: DayEntryExtract;
};

function emptyStructured(): DayEntryExtract {
  return {};
}

/**
 * Безопасный парсинг ответа OpenAI: текстовые поля для UI + structured для DayEntry.
 * При ошибке structured возвращает пустой объект, UI-поля всё равно заполняются.
 */
export function parseAnalyzeDayTextResponse(content: string): ParsedAnalyzeDayText {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error("OpenAI вернул невалидный JSON");
  }

  const rawResult = rawAnalyzeDayTextResponseSchema.safeParse(raw);
  if (!rawResult.success) {
    throw new Error("OpenAI вернул JSON неожиданной структуры");
  }

  const displayResult = dayTextDisplaySchema.safeParse(rawResult.data);
  const display: DayTextDisplay = displayResult.success
    ? displayResult.data
    : DAY_TEXT_DISPLAY_FIELDS.reduce((acc, field) => {
        const value = rawResult.data[field];
        acc[field] =
          typeof value === "string" && value.trim().length > 0 ? value.trim() : NOT_SPECIFIED;
        return acc;
      }, {} as DayTextDisplay);

  const entryRaw = rawResult.data.entry;
  if (entryRaw === null || entryRaw === undefined) {
    return { display, structured: emptyStructured() };
  }

  const structuredResult = dayEntryExtractSchema.safeParse(entryRaw);
  if (!structuredResult.success) {
    console.warn("[AI] dayEntryExtractSchema validation failed:", structuredResult.error.flatten());
    return { display, structured: emptyStructured() };
  }

  return { display, structured: structuredResult.data };
}

/** Пример JSON для промпта — structured-часть совместима с DayEntry. */
export function buildAnalyzeDayTextPromptExample(): string {
  return JSON.stringify(
    {
      nutrition: "Завтрак: овсянка с бананом; обед: суп",
      water: "1 литр",
      otherDrinks: "2 чашки чая, 1 кофе",
      sleep: "6 часов",
      pressure: "125/80",
      mood: "7 из 10",
      wellbeing: "нормальное",
      advice: "Попробуйте выпить ещё стакан воды до обеда.",
      entry: {
        meals: [
          { type: "breakfast1", food: "овсянка с бананом", time: "08:00" },
          { type: "lunch", food: "суп", time: "13:00" },
        ],
        water: 1000,
        tea: 500,
        coffee: 200,
        sleep: 6,
        mood: 7,
        wellbeing: "нормальное",
        systolic: 125,
        diastolic: 80,
      },
    },
    null,
    2,
  );
}
