import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const prepareRecoveryVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.enum(["meditation", "craving", "audio"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const { prepareVoice } = await import("@/integrations/yandexgpt/recovery-voice.server");
      return { ok: true as const, clips: await prepareVoice(data.id) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const detail = /SpeechKit (401|403)/.test(message)
        ? "Для голоса Яндекса нужно настроить права доступа в Яндекс Облаке."
        : /SpeechKit 400/.test(message)
          ? "Яндекс не принял настройки озвучки. Требуется проверка подключения."
          : /SpeechKit 429/.test(message)
            ? "Достигнут лимит озвучки Яндекса. Попробуйте позже."
            : "Голос Яндекса пока недоступен.";
      return {
        ok: false as const,
        error: `${detail} Можно выбрать голос устройства или пройти практику без озвучки.`,
      };
    }
  });
