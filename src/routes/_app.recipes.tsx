import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFiltersPanel } from "@/components/recipes/RecipeFiltersPanel";
import { DEFAULT_RECIPE_FILTERS, filterRecipes, type RecipeFilters } from "@/lib/recipes";
import { useProfile, GOAL_LABELS } from "@/lib/store";
import { ChefHat, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/recipes")({
  component: RecipesPage,
});

function RecipesPage() {
  const { profile } = useProfile();
  const [filters, setFilters] = useState<RecipeFilters>(() => ({
    ...DEFAULT_RECIPE_FILTERS,
    goal: profile?.goal ?? "all",
  }));

  useEffect(() => {
    if (profile?.goal) {
      setFilters((prev) => (prev.goal === "all" ? { ...prev, goal: profile.goal! } : prev));
    }
  }, [profile?.goal]);

  const recipes = useMemo(() => filterRecipes(filters), [filters]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <PageHeader
        title="Рецепты"
        subtitle="Подбор блюд по цели, здоровью и ингредиентам"
        backTo="/home"
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500/90 via-amber-500/80 to-yellow-400/70 p-5 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <ChefHat className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">Полезные рецепты</h2>
            <p className="mt-1 text-sm opacity-90">
              {profile?.goal
                ? `Цель профиля: ${GOAL_LABELS[profile.goal]}. Фильтры можно изменить ниже.`
                : "Выберите фильтры или ищите по ингредиентам."}
            </p>
          </div>
        </div>
      </Card>

      <RecipeFiltersPanel filters={filters} onChange={setFilters} resultCount={recipes.length} />

      <Card className="border-dashed bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Скоро: AI-подбор рецептов, замена ингредиентов, меню на день и неделю, список покупок.
          </p>
        </div>
      </Card>

      {recipes.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Рецепты не найдены. Попробуйте изменить фильтры.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
