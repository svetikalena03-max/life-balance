import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const prepareWorkoutVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { prepareWorkoutClips } =
        await import("@/integrations/yandexgpt/recovery-voice.server");
      return { ok: true as const, clips: await prepareWorkoutClips(data.id) };
    } catch {
      return {
        ok: false as const,
        error:
          "Голос Яндекса недоступен. Попробуйте ещё раз или выключите голос и начните тренировку.",
      };
    }
  });
