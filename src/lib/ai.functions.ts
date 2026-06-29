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
