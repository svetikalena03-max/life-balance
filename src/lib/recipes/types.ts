import type { Goal } from "@/lib/store";

/** Цели питания — совместимы с Goal из профиля. */
export type RecipeGoalTag = Goal;

/** Ключи заболеваний — совместимы с CHRONIC_OPTIONS в store. */
export type RecipeConditionTag = string;

export type RecipeMealType = "breakfast" | "lunch" | "dinner" | "snack";

export type RecipeMacros = {
  protein: number;
  fat: number;
  carbs: number;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  amount: string;
  /** Для будущей AI-замены ингредиентов */
  optional?: boolean;
  substitutes?: string[];
};

export type RecipeStep = {
  order: number;
  text: string;
};

export type RecipeTags = {
  goals: RecipeGoalTag[];
  conditions: RecipeConditionTag[];
  mealTypes: RecipeMealType[];
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  /** Заглушка изображения: emoji + CSS-класс градиента */
  imageEmoji: string;
  imageGradient: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories: number;
  macros: RecipeMacros;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: RecipeTags;
  /** Нормализованные названия для поиска по ингредиентам */
  searchIngredients: string[];
};

export type RecipeTimeFilter = "all" | 15 | 30 | 45 | 60;

export type RecipeFilters = {
  /** Общий текстовый поиск по названию и описанию */
  query: string;
  condition: RecipeConditionTag | "all";
  goal: RecipeGoalTag | "all";
  maxMinutes: RecipeTimeFilter;
  /** Поиск по конкретному ингредиенту */
  ingredientQuery: string;
};

export const DEFAULT_RECIPE_FILTERS: RecipeFilters = {
  query: "",
  condition: "all",
  goal: "all",
  maxMinutes: "all",
  ingredientQuery: "",
};

/** Контракт каталога — позже можно заменить на AI/API-реализацию. */
export type RecipeCatalogService = {
  list(): Recipe[];
  findById(id: string): Recipe | undefined;
  filter(filters: RecipeFilters): Recipe[];
};

// --- Заготовки для следующих этапов ---

export type MenuMealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type DailyMenuPlan = {
  date: string;
  meals: Partial<Record<MenuMealSlot, string>>;
};

export type WeeklyMenuPlan = {
  weekStart: string;
  days: DailyMenuPlan[];
};

export type ShoppingListItem = {
  id: string;
  ingredientName: string;
  amount: string;
  recipeIds: string[];
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  createdAt: string;
  items: ShoppingListItem[];
};
