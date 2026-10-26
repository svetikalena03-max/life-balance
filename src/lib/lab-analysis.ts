import { z } from "zod";

// Never show provider responses or validation input: they may contain lab data.
export function labFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/status (401|403)\b/.test(message))
    return "Сервис разбора не получил доступ к Яндексу. Требуется проверка подключения приложения.";
  if (/status 429\b/.test(message)) return "Достигнут лимит запросов к Яндексу. Попробуйте позже.";
  if (/60 секунд|abort|timeout/i.test(message))
    return "Яндекс не успел ответить. Попробуйте разобрать один показатель.";
  if (error instanceof SyntaxError || error instanceof z.ZodError || /Неполный ответ/.test(message))
    return "Ответ Яндекса не удалось прочитать полностью. Попробуйте разобрать один показатель.";
  return "Сервис разбора сейчас недоступен. Введённые данные остались в форме. Повторите позже.";
}

export const labRowSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(60),
  unit: z.string().trim().max(60),
  reference: z.string().trim().max(120),
});
export type LabRow = z.infer<typeof labRowSchema>;
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
  const result = labExplanationSchema.parse(JSON.parse(text));
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
