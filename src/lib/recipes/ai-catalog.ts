import { findRecipeById } from "./catalog";
import { RECIPES } from "./data";
import type { Recipe } from "./types";

export function buildRecipeCatalogForAI(): string {
  const compact = RECIPES.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    calories: recipe.calories,
    totalMinutes: recipe.prepMinutes + recipe.cookMinutes,
    macros: recipe.macros,
    goals: recipe.tags.goals,
    conditions: recipe.tags.conditions,
    mealTypes: recipe.tags.mealTypes,
  }));
  return JSON.stringify(compact);
}

export type ResolvedRecipeSuggestions = {
  matched: Array<{ recipe: Recipe; reason: string }>;
  unknownIds: string[];
};

export function resolveRecipeSuggestions(
  items: Array<{ recipeId: string; reason: string }>,
): ResolvedRecipeSuggestions {
  const seen = new Set<string>();
  const matched: Array<{ recipe: Recipe; reason: string }> = [];
  const unknownIds: string[] = [];

  for (const item of items) {
    if (seen.has(item.recipeId)) continue;
    seen.add(item.recipeId);

    const recipe = findRecipeById(item.recipeId);
    if (!recipe) {
      unknownIds.push(item.recipeId);
      continue;
    }

    matched.push({
      recipe,
      reason: item.reason.trim() || "Подходит под ваш профиль.",
    });
  }

  return { matched, unknownIds };
}
