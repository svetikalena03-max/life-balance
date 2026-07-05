import { CHRONIC_OPTIONS, GOAL_LABELS, type Goal } from "@/lib/store";
import type { RecipeTimeFilter } from "./types";

export const RECIPE_GOAL_OPTIONS: Array<{ value: Goal | "all"; label: string }> = [
  { value: "all", label: "Любая цель" },
  ...(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({ value: g, label: GOAL_LABELS[g] })),
];

export const RECIPE_CONDITION_OPTIONS = [
  { value: "all", label: "Любое заболевание" },
  ...CHRONIC_OPTIONS.map(([value, label]) => ({ value, label })),
];

export const RECIPE_TIME_OPTIONS: Array<{ value: RecipeTimeFilter; label: string }> = [
  { value: "all", label: "Любое время" },
  { value: 15, label: "До 15 мин" },
  { value: 30, label: "До 30 мин" },
  { value: 45, label: "До 45 мин" },
  { value: 60, label: "До 60 мин" },
];
