import { RECIPES } from "./data";
import type { Recipe, RecipeCatalogService, RecipeFilters } from "./types";

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function totalMinutes(recipe: Recipe): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}

export function filterRecipes(filters: RecipeFilters, source: Recipe[] = RECIPES): Recipe[] {
  const q = normalize(filters.query);
  const ingredientQ = normalize(filters.ingredientQuery);

  return source.filter((recipe) => {
    if (filters.condition !== "all" && !recipe.tags.conditions.includes(filters.condition)) {
      return false;
    }

    if (filters.goal !== "all" && !recipe.tags.goals.includes(filters.goal)) {
      return false;
    }

    if (filters.maxMinutes !== "all" && totalMinutes(recipe) > filters.maxMinutes) {
      return false;
    }

    if (q) {
      const haystack = normalize(`${recipe.title} ${recipe.description}`);
      if (!haystack.includes(q)) return false;
    }

    if (ingredientQ) {
      const match = recipe.searchIngredients.some((i) => i.includes(ingredientQ))
        || recipe.ingredients.some((i) => normalize(i.name).includes(ingredientQ));
      if (!match) return false;
    }

    return true;
  });
}

export function findRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export const recipeCatalog: RecipeCatalogService = {
  list: () => RECIPES,
  findById: findRecipeById,
  filter: (filters) => filterRecipes(filters),
};

/** Локальный подбор по фильтрам каталога (без OpenAI). */
export function suggestRecipesByFilters(filters: RecipeFilters): Recipe[] {
  return filterRecipes(filters);
}
