import { z } from "zod";

export class LabRowsNotFoundError extends Error {
  constructor() {
    super("В распознанном тексте не найдены лабораторные показатели");
    this.name = "LabRowsNotFoundError";
  }
}

// Safe for server logs: it reports only parser shape and validation paths,
// never the model response or the user's laboratory data.
export function labFailureDiagnostic(error: unknown, modelText?: string) {
  const output = {
    length: modelText?.length ?? 0,
    first: modelText?.trim().slice(0, 1) || "",
    last: modelText?.trim().slice(-1) || "",
  };
  if (error instanceof z.ZodError)
    return {
      kind: "zod",
      output,
      issues: error.issues.slice(0, 8).map((issue) => ({ code: issue.code, path: issue.path })),
    };
  return {
    kind: error instanceof Error ? error.name : "unknown",
    output,
  };
}

// Never show provider responses or validation input: they may contain lab data.
export function labFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/status (401|403)\b/.test(message))
    return "Сервис разбора не получил доступ к Яндексу. Требуется проверка подключения приложения.";
  if (/status 429\b/.test(message)) return "Достигнут лимит запросов к Яндексу. Попробуйте позже.";
  if (/60 секунд|abort|timeout/i.test(message))
    return "Яндекс не успел ответить. Попробуйте разобрать один показатель.";
  if (error instanceof LabRowsNotFoundError)
    return "Яндекс прочитал файл, но не нашёл в нём строки с показателями. Попробуйте более крупное фото таблицы.";
  if (error instanceof SyntaxError || error instanceof z.ZodError || /Неполный ответ/.test(message))
    return "Ответ Яндекса не удалось прочитать полностью. Попробуйте разобрать один показатель.";
  return "Сервис разбора сейчас недоступен. Введённые данные остались в форме. Повторите позже.";
}

export const labRowSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(60),
  unit: z.string().trim().max(60),
  // Lab reports may include long age/sex/pregnancy-specific reference notes.
  // Keep the literal text for the user's review instead of rejecting the row.
  reference: z.string().trim().max(1000),
});
export type LabRow = z.infer<typeof labRowSchema>;

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed);
}

export function parseLabRows(text: string): LabRow[] {
  // Model output may encode a result as a JSON number and absent units as null.
  // Normalize only these representations; never infer values or reference ranges.
  const json = parseModelJson(text);
  if (
    typeof json === "object" &&
    json !== null &&
    "rows" in json &&
    Array.isArray(json.rows) &&
    json.rows.length === 0
  )
    throw new LabRowsNotFoundError();
  const result = z
    .object({
      rows: z
        .array(
          z.object({
            name: labRowSchema.shape.name,
            value: z.union([labRowSchema.shape.value, z.number().finite().transform(String)]),
            unit: z
              .string()
              .nullish()
              .transform((value) => value ?? ""),
            reference: z
              .string()
              .nullish()
              .transform((value) => value ?? ""),
          }),
        )
        .min(1)
        .max(40),
    })
    .parse(json);
  return result.rows.map((row) => labRowSchema.parse(row));
}
export type LabStatus = "within" | "low" | "high" | "unknown";
export const LAB_STATUS_LABELS: Record<LabStatus, string> = {
  within: "В пределах интервала лаборатории",
  low: "Ниже интервала лаборатории",
  high: "Выше интервала лаборатории",
  unknown: "Нужна проверка нормы или единиц",
};

// Only compare explicit numeric intervals. Never invent a reference range or
// interpret qualitative/censored measurements as exact numbers.
export function compareLabRow(row: LabRow): LabStatus {
  const number = "[+-]?\\d+(?:[.,]\\d+)?";
  const exact = new RegExp(`^${number}$`);
  const value = row.value.trim();
  const ref = row.reference.trim().replace(/\u2212/g, "-");
  if (!row.unit.trim() || !exact.test(value)) return "unknown";
  const n = Number(value.replace(",", "."));
  const range = ref.match(new RegExp(`^(${number})\\s*[-–—]\\s*(${number})$`));
  if (range) {
    const low = Number(range[1].replace(",", "."));
    const high = Number(range[2].replace(",", "."));
    if (low > high) return "unknown";
    return n < low ? "low" : n > high ? "high" : "within";
  }
  const limit = ref.match(new RegExp(`^(<=|>=|<|>|≤|≥)\\s*(${number})$`));
  if (!limit) return "unknown";
  const bound = Number(limit[2].replace(",", "."));
  switch (limit[1]) {
    case "<":
      return n < bound ? "within" : "high";
    case "<=":
    case "≤":
      return n <= bound ? "within" : "high";
    case ">":
      return n > bound ? "within" : "low";
    default:
      return n >= bound ? "within" : "low";
  }
}

export const labInputSchema = z.object({
  rows: z.array(labRowSchema).min(1).max(40),
  context: z.string().trim().max(1500),
});

export const labExplanationSchema = z.object({
  indicators: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        explanation: z.string().trim().min(1).max(2000),
      }),
    )
    .max(40),
  questions: z.array(z.string().trim().min(1).max(500)).max(6),
  limitations: z.string().trim().min(1).max(2000),
});

export function parseLabExplanation(text: string, count: number) {
  const result = labExplanationSchema.parse(parseModelJson(text));
  const indexes = new Set(result.indicators.map((row) => row.index));
  if (
    indexes.size !== count ||
    result.indicators.length !== count ||
    result.indicators.some((row) => row.index >= count)
  ) {
    throw new Error("Неполный ответ. Попробуйте разобрать меньше показателей за один раз.");
  }
  return result;
}
