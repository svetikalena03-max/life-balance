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

export function resolveRecipeSuggestions(
  items: Array<{ recipeId: string; reason: string }>,
): Array<{ recipe: Recipe; reason: string }> {
  const seen = new Set<string>();
  const result: Array<{ recipe: Recipe; reason: string }> = [];

  for (const item of items) {
    if (seen.has(item.recipeId)) continue;
    const recipe = findRecipeById(item.recipeId);
    if (!recipe) continue;
    seen.add(item.recipeId);
    result.push({
      recipe,
      reason: item.reason.trim() || "Подходит под ваш профиль.",
    });
  }

  return result;
}
