import { findRecoveryItem } from "../../lib/recovery-data.ts";

// Only the three fixed public scripts can be synthesized. Cache successful
// results and in-flight requests to avoid synthesizing on every playback.
const clips = new Map<string, Promise<string>>();

export async function prepareVoice(id: string): Promise<string[]> {
  const item = findRecoveryItem(id);
  const apiKey = process.env.YANDEX_SPEECHKIT_API_KEY || process.env.YANDEX_CLOUD_API_KEY;
  if (!apiKey || item?.mode !== "guided" || !item.steps) throw new Error("Voice not configured");
  return Promise.all(
    item.steps.map((step, index) => {
      const key = `${id}:${index}:${step.ru}`;
      let clip = clips.get(key);
      if (!clip) {
        clip = (async () => {
          const response = await fetch(
            "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
            {
              method: "POST",
              signal: AbortSignal.timeout(15000),
              headers: {
                Authorization: `Api-Key ${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                text: step.ru,
                lang: "ru-RU",
                voice: "marina",
                emotion: "friendly",
                speed: "0.9",
                format: "mp3",
              }),
            },
          );
          if (!response.ok) throw new Error(`SpeechKit ${response.status}`);
          const bytes = Buffer.from(await response.arrayBuffer());
          if (!bytes.length || bytes.length > 500000) throw new Error("Invalid voice response");
          return `data:audio/mpeg;base64,${bytes.toString("base64")}`;
        })();
        clips.set(key, clip);
        void clip.catch(() => clips.delete(key));
      }
      return clip;
    }),
  );
}
