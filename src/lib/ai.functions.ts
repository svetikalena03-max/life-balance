import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildAnalyzeDayTextPromptExample,
  parseAnalyzeDayTextResponse,
  type DayEntryExtract,
  type DayTextDisplay,
} from "./ai-day-analysis";
import { buildAIConsultantSystemPrompt } from "./ai-prompts";
const analyzeMealInputSchema = z.object({
  foodText: z.string().trim().min(1, "Укажите, что было съедено"),
  age: z.number().int().positive("Возраст должен быть положительным числом"),
  height: z.number().positive("Рост должен быть положительным числом"),
  weight: z.number().positive("Вес должен быть положительным числом"),
  goal: z.string().trim().min(1, "Укажите цель пользователя"),
  diseases: z.string().trim().optional(),
});

export type AnalyzeMealInput = z.infer<typeof analyzeMealInputSchema>;

export type AnalyzeMealSuccess = {
  ok: true;
  summary: string;
  recommendations: string[];
};

export type AnalyzeMealFailure = {
  ok: false;
  error: string;
};

export type AnalyzeMealResult = AnalyzeMealSuccess | AnalyzeMealFailure;

const OPENAI_NOT_CONFIGURED_ERROR =
  "OpenAI API не настроен. Добавьте OPENAI_API_KEY в файл .env (см. .env.example).";

function buildAnalyzeMealPrompt(input: AnalyzeMealInput): string {
  const diseasesLine = input.diseases?.length
    ? `Заболевания и ограничения: ${input.diseases}`
    : "Заболевания и ограничения: не указаны";

  return [
    "Проанализируй приём пищи пользователя приложения «Баланс жизни».",
    "Дай краткую оценку рациона и 2–4 практические рекомендации с учётом профиля.",
    "Пиши на русском языке.",
    "",
    `Приём пищи: ${input.foodText}`,
    `Возраст: ${input.age} лет`,
    `Рост: ${input.height} см`,
    `Вес: ${input.weight} кг`,
    `Цель: ${input.goal}`,
    diseasesLine,
    "",
    "Ответь строго в формате JSON:",
    '{"summary":"краткая оценка приёма пищи","recommendations":["рекомендация 1","рекомендация 2"]}',
  ].join("\n");
}

function parseAnalyzeMealResponse(content: string): AnalyzeMealSuccess {
  const parsed = JSON.parse(content) as { summary?: unknown; recommendations?: unknown };

  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
    throw new Error("OpenAI вернул ответ без поля summary");
  }

  if (!Array.isArray(parsed.recommendations)) {
    throw new Error("OpenAI вернул ответ без списка recommendations");
  }

  const recommendations = parsed.recommendations
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());

  return {
    ok: true,
    summary: parsed.summary.trim(),
    recommendations,
  };
}

async function runAnalyzeMeal(input: AnalyzeMealInput): Promise<AnalyzeMealResult> {
  const { isOpenAIConfigured, openai, getOpenAIModel } = await import(
    "@/integrations/openai/client.server"
  );

  if (!isOpenAIConfigured()) {
    return { ok: false, error: OPENAI_NOT_CONFIGURED_ERROR };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildAIConsultantSystemPrompt(),
        },
        {
          role: "user",
          content: buildAnalyzeMealPrompt(input),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "OpenAI вернул пустой ответ" };
    }

    return parseAnalyzeMealResponse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить AI-анализ";
    console.error("[AI] analyzeMeal failed:", error);
    return { ok: false, error: message };
  }
}

export const analyzeMeal = createServerFn({ method: "POST" })
  .inputValidator((data) => analyzeMealInputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeMealResult> => runAnalyzeMeal(data));

const analyzeDayTextInputSchema = z.object({
  dayText: z.string().trim().min(1, "Опишите свой день"),
});

export type AnalyzeDayTextInput = z.infer<typeof analyzeDayTextInputSchema>;

/** Текстовые поля для отображения в UI (обратная совместимость). */
export type DayTextAnalysis = DayTextDisplay;

export type { DayEntryExtract };

export type AnalyzeDayTextSuccess = {
  ok: true;
  analysis: DayTextAnalysis;
  /** Structured-данные, совместимые с DayEntry (без date). Используется на этапе сохранения. */
  structured: DayEntryExtract;
};

export type AnalyzeDayTextResult = AnalyzeDayTextSuccess | AnalyzeMealFailure;

function buildAnalyzeDayTextPrompt(dayText: string): string {
  return [
    "Пользователь приложения «Баланс жизни» описал свой день свободным текстом.",
    "Извлеки данные и верни JSON с двумя уровнями:",
    "1) Текстовые поля верхнего уровня — для отображения пользователю на русском языке.",
    "   Если данных нет — пиши «не указано».",
    "2) Объект entry — structured-данные для сохранения в дневник (числа, булевы, массив meals).",
    "   Включай в entry только те поля, которые явно упомянуты в тексте.",
    "   Не включай поля, которых нет в тексте.",
    "",
    "Правила для entry:",
    "- water, tea, coffee, soda, juice — объём в миллилитрах (целые числа).",
    "- sleep — часы сна (число, например 6.5).",
    "- mood, energy — шкала 1–10 (целое число).",
    "- systolic, diastolic — верхнее и нижнее давление (целые числа).",
    "- pulse — пульс ударов/мин (целое число).",
    "- weight — вес в кг (число).",
    "- steps — шаги (целое число).",
    "- meals — массив приёмов пищи: type (breakfast1|breakfast2|snack1|lunch|snack2|dinner|lateSnack|extra), food, portion, time, comment.",
    "- edema, heartburn, bloating, backPain, kneePain, stressed, milk — true/false.",
    "- sugar — none|one|two|other.",
    "",
    "В поле advice дай один короткий безопасный совет по образу жизни (без диагнозов).",
    "",
    `Текст пользователя: ${dayText}`,
    "",
    "Ответь строго в формате JSON (пример структуры):",
    buildAnalyzeDayTextPromptExample(),
  ].join("\n");
}

function parseAnalyzeDayTextSuccess(content: string): AnalyzeDayTextSuccess {
  const { display, structured } = parseAnalyzeDayTextResponse(content);
  return { ok: true, analysis: display, structured };
}

async function runAnalyzeDayText(input: AnalyzeDayTextInput): Promise<AnalyzeDayTextResult> {
  const { isOpenAIConfigured, openai, getOpenAIModel } = await import(
    "@/integrations/openai/client.server"
  );

  if (!isOpenAIConfigured()) {
    return { ok: false, error: OPENAI_NOT_CONFIGURED_ERROR };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildAIConsultantSystemPrompt(),
        },
        {
          role: "user",
          content: buildAnalyzeDayTextPrompt(input.dayText),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "OpenAI вернул пустой ответ" };
    }

    return parseAnalyzeDayTextSuccess(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить AI-анализ";
    console.error("[AI] analyzeDayText failed:", error);
    return { ok: false, error: message };
  }
}

export const analyzeDayText = createServerFn({ method: "POST" })
  .inputValidator((data) => analyzeDayTextInputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeDayTextResult> => runAnalyzeDayText(data));
