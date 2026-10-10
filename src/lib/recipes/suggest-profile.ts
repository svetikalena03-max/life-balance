import {
  GI_OPTIONS,
  CHRONIC_OPTIONS,
  MUSCULO_OPTIONS,
  WOMEN_OPTIONS,
  GOAL_LABELS,
  TRAINING_OPTIONS,
  type Profile,
} from "@/lib/store";

export type SuggestRecipesRequest = {
  goal: string;
  conditions?: string;
  restrictions?: string;
  age?: number;
};

function labelFromOptions(
  value: string,
  options: ReadonlyArray<readonly [string, string]>,
): string | null {
  return options.find(([key]) => key === value)?.[1] ?? null;
}

export function buildSuggestRecipesRequest(profile: Profile | null): SuggestRecipesRequest {
  const hf = profile?.healthFeatures;
  const restrictions: string[] = [];

  (hf?.gi ?? []).forEach((value) => {
    const label = labelFromOptions(value, GI_OPTIONS);
    if (label) restrictions.push(label);
  });

  (hf?.training ?? []).forEach((value) => {
    const label = labelFromOptions(value, TRAINING_OPTIONS);
    if (label) restrictions.push(label);
  });

  if (hf?.giIntolerances?.trim()) restrictions.push(hf.giIntolerances.trim());
  if (hf?.chronicOther?.trim()) restrictions.push(hf.chronicOther.trim());
  if (hf?.comment?.trim()) restrictions.push(hf.comment.trim());
  if (hf?.medsList?.trim()) restrictions.push(`Лекарства: ${hf.medsList.trim()}`);
  if (hf?.doctorRec?.trim()) restrictions.push(`Рекомендации врача: ${hf.doctorRec.trim()}`);

  const conditions = [
    ...(hf?.chronic ?? [])
      .filter((value) => !["none", "other"].includes(value))
      .map((value) => labelFromOptions(value, CHRONIC_OPTIONS)),
    ...(hf?.musculo ?? [])
      .filter((value) => value !== "other")
      .map((value) => labelFromOptions(value, MUSCULO_OPTIONS)),
    ...(hf?.women ?? [])
      .filter((value) => !["na", "skip"].includes(value))
      .map((value) => labelFromOptions(value, WOMEN_OPTIONS)),
  ].filter(Boolean);

  return {
    goal: profile?.goal ? GOAL_LABELS[profile.goal] : "Улучшение здоровья",
    conditions: conditions.length ? conditions.join("; ") : undefined,
    restrictions: restrictions.length > 0 ? restrictions.join("; ") : undefined,
    age: profile?.age && profile.age > 0 ? profile.age : undefined,
  };
}
