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
    } catch {
      return {
        ok: false as const,
        error:
          "Голос Яндекса пока недоступен. Можно выбрать голос устройства или пройти практику без озвучки.",
      };
    }
  });
