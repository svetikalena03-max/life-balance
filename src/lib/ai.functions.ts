import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

export type DayTextAnalysis = {
  nutrition: string;
  water: string;
  otherDrinks: string;
  sleep: string;
  pressure: string;
  mood: string;
  wellbeing: string;
  advice: string;
};

export type AnalyzeDayTextSuccess = {
  ok: true;
  analysis: DayTextAnalysis;
};

export type AnalyzeDayTextResult = AnalyzeDayTextSuccess | AnalyzeMealFailure;

const NOT_SPECIFIED = "не указано";

const DAY_TEXT_FIELDS: Array<keyof DayTextAnalysis> = [
  "nutrition",
  "water",
  "otherDrinks",
  "sleep",
  "pressure",
  "mood",
  "wellbeing",
  "advice",
];

function buildAnalyzeDayTextPrompt(dayText: string): string {
  return [
    "Пользователь приложения «Баланс жизни» описал свой день свободным текстом.",
    "Извлеки из текста данные и структурируй их. Если чего-то нет в тексте — напиши «не указано».",
    "В поле advice дай один короткий безопасный совет по образу жизни (без диагнозов).",
    "Пиши на русском языке.",
    "",
    `Текст пользователя: ${dayText}`,
    "",
    "Ответь строго в формате JSON со следующими полями:",
    JSON.stringify({
      nutrition: "что и когда ел(а)",
      water: "количество воды",
      otherDrinks: "чай, кофе, соки и прочие напитки",
      sleep: "сколько спал(а)",
      pressure: "артериальное давление",
      mood: "настроение",
      wellbeing: "самочувствие",
      advice: "краткий совет",
    }),
  ].join("\n");
}

function parseAnalyzeDayTextResponse(content: string): AnalyzeDayTextSuccess {
  const parsed = JSON.parse(content) as Record<string, unknown>;

  const analysis = DAY_TEXT_FIELDS.reduce((acc, field) => {
    const value = parsed[field];
    acc[field] = typeof value === "string" && value.trim().length > 0 ? value.trim() : NOT_SPECIFIED;
    return acc;
  }, {} as DayTextAnalysis);

  return { ok: true, analysis };
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

    return parseAnalyzeDayTextResponse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить AI-анализ";
    console.error("[AI] analyzeDayText failed:", error);
    return { ok: false, error: message };
  }
}

export const analyzeDayText = createServerFn({ method: "POST" })
  .inputValidator((data) => analyzeDayTextInputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeDayTextResult> => runAnalyzeDayText(data));
