// Server-side YandexGPT client. The API key must never be exposed to the client bundle.

import { z } from "zod";

const YANDEX_AI_COMPLETION_URL = "https://ai.api.cloud.yandex.net/foundationModels/v1/completion";
const DEFAULT_YANDEX_AI_MODEL = "yandexgpt/latest";
const YANDEX_AI_REQUEST_TIMEOUT_MS = 60_000;

type YandexGPTMessage = {
  role: "system" | "user" | "assistant";
  text: string;
};

export type YandexGPTCompletionOptions = {
  messages: YandexGPTMessage[];
  temperature?: number;
  maxTokens?: number;
};

const yandexGPTConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  folderId: z.string().trim().min(1),
  model: z.string().trim().min(1),
});

const completionAlternativeSchema = z.object({
  message: z.object({
    text: z.string(),
  }),
  status: z.string().optional(),
});

const completionPayloadSchema = z.object({
  alternatives: z.array(completionAlternativeSchema).min(1),
});

const completionResponseSchema = z
  .object({
    result: completionPayloadSchema.optional(),
    alternatives: z.array(completionAlternativeSchema).min(1).optional(),
  })
  .refine((value) => Boolean(value.result || value.alternatives), {
    message: "YandexGPT response does not contain alternatives",
  });

function readYandexGPTConfig() {
  return yandexGPTConfigSchema.parse({
    apiKey: process.env.YANDEX_CLOUD_API_KEY,
    folderId: process.env.YANDEX_CLOUD_FOLDER_ID,
    model: process.env.YANDEX_AI_MODEL?.trim() || DEFAULT_YANDEX_AI_MODEL,
  });
}

function buildModelUri(folderId: string, model: string): string {
  return model.startsWith("gpt://") ? model : `gpt://${folderId}/${model}`;
}

export function isYandexGPTConfigured(): boolean {
  return Boolean(
    process.env.YANDEX_CLOUD_API_KEY?.trim() && process.env.YANDEX_CLOUD_FOLDER_ID?.trim(),
  );
}

export async function generateYandexGPTCompletion({
  messages,
  temperature = 0.3,
  maxTokens = 2_000,
}: YandexGPTCompletionOptions): Promise<string> {
  const { apiKey, folderId, model } = readYandexGPTConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), YANDEX_AI_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(YANDEX_AI_COMPLETION_URL, {
      method: "POST",
      headers: {
        Authorization: `Api-Key ${apiKey}`,
        "Content-Type": "application/json",
        "x-data-logging-enabled": "false",
      },
      body: JSON.stringify({
        modelUri: buildModelUri(folderId, model),
        completionOptions: {
          stream: false,
          temperature,
          maxTokens: String(maxTokens),
        },
        messages,
        jsonObject: true,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("YandexGPT не ответил за 60 секунд. Попробуйте повторить запрос позже.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`YandexGPT request failed with status ${response.status}`);
  }

  const raw: unknown = await response.json();
  const parsed = completionResponseSchema.parse(raw);
  const payload = parsed.result ?? { alternatives: parsed.alternatives! };
  const content = payload.alternatives[0]?.message.text.trim();

  if (!content) {
    throw new Error("YandexGPT вернул пустой ответ");
  }

  return content;
}
