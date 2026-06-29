// Server-side OpenAI client. API key must never be exposed to the client bundle.
// Load inside server handlers: const { openai, getOpenAIModel } = await import("@/integrations/openai/client.server");
import OpenAI from "openai";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type OpenAIConfig = {
  apiKey: string;
  model: string;
};

function readOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

  if (!apiKey) {
    const message =
      "Missing OpenAI environment variable: OPENAI_API_KEY. Add it to .env (see .env.example).";
    console.error(`[OpenAI] ${message}`);
    throw new Error(message);
  }

  return { apiKey, model };
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function createOpenAIClient(): OpenAI {
  const { apiKey } = readOpenAIConfig();
  return new OpenAI({ apiKey });
}

let _openai: OpenAI | undefined;

// SECURITY: Only use this for trusted server-side operations, never expose to client code.
export const openai = new Proxy({} as OpenAI, {
  get(_, prop, receiver) {
    if (!_openai) _openai = createOpenAIClient();
    return Reflect.get(_openai, prop, receiver);
  },
});
