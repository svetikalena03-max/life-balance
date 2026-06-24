// Заглушки будущих AI-модулей. Единая точка интеграции с Lovable AI Gateway.
// После подключения Supabase сюда же подключим серверные функции и кеширование.

import type { DayEntry, Profile } from "./store";

export interface DayAnalysis {
  summary: string;
  recommendations: string[];
}

export async function analyzeDay(_entry: DayEntry, _profile: Profile | null): Promise<DayAnalysis> {
  return {
    summary: "AI-анализ появится после подключения языковой модели.",
    recommendations: [
      "Сохраняйте записи в дневнике каждый день.",
      "Следите за давлением и пульсом.",
      "Старайтесь спать не менее 7 часов.",
    ],
  };
}

export async function suggestMenuForTomorrow(_profile: Profile | null): Promise<string[]> {
  return [];
}

export async function transcribeVoice(_audio: Blob): Promise<string> {
  return "";
}
