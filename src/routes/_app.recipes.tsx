import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFiltersPanel } from "@/components/recipes/RecipeFiltersPanel";
import { suggestRecipes, type SuggestRecipesResult } from "@/lib/ai.functions";
import {
  DEFAULT_RECIPE_FILTERS,
  buildSuggestRecipesRequest,
  filterRecipes,
  resolveRecipeSuggestions,
  type RecipeFilters,
} from "@/lib/recipes";
import { useProfile, GOAL_LABELS } from "@/lib/store";
import { ChefHat, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/recipes")({
  component: RecipesPage,
});

function RecipesPage() {
  const { profile } = useProfile();
  const suggestRecipesFn = useServerFn(suggestRecipes);
  const [filters, setFilters] = useState<RecipeFilters>(() => ({
    ...DEFAULT_RECIPE_FILTERS,
    goal: profile?.goal ?? "all",
  }));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SuggestRecipesResult | null>(null);

  useEffect(() => {
    if (profile?.goal) {
      setFilters((prev) => (prev.goal === "all" ? { ...prev, goal: profile.goal! } : prev));
    }
  }, [profile?.goal]);

  const recipes = useMemo(() => filterRecipes(filters), [filters]);

  const aiRecommendations = useMemo(() => {
    if (!aiResult?.ok) return [];
    return resolveRecipeSuggestions(aiResult.recommendations);
  }, [aiResult]);

  const runAiSuggest = async () => {
    setAiLoading(true);
    setAiResult(null);

    try {
      const response = await suggestRecipesFn({ data: buildSuggestRecipesRequest(profile) });
      setAiResult(response);
    } catch (error) {
      setAiResult({
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось подобрать рецепты",
      });
    } finally {
      setAiLoading(false);
    }
  };

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
                ? `Цель профиля: ${GOAL_LABELS[profile.goal]}. AI учтёт цель и особенности здоровья.`
                : "AI подберёт рецепты по вашему профилю или выберите фильтры ниже."}
            </p>
          </div>
        </div>
      </Card>

      <Button
        type="button"
        size="lg"
        onClick={runAiSuggest}
        disabled={aiLoading}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {aiLoading ? "Подбираю рецепты..." : "Подобрать рецепты"}
      </Button>

      {aiResult && !aiResult.ok && (
        <Alert variant="destructive">
          <AlertTitle>AI недоступен</AlertTitle>
          <AlertDescription>{aiResult.error}</AlertDescription>
        </Alert>
      )}

      {aiResult?.ok && (
        <div className="flex flex-col gap-3">
          <Alert>
            <AlertTitle>Персональные рекомендации</AlertTitle>
            <AlertDescription>{aiResult.summary}</AlertDescription>
          </Alert>

          {aiRecommendations.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              AI не смог сопоставить рецепты с каталогом. Попробуйте ещё раз или используйте фильтры ниже.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aiRecommendations.map(({ recipe, reason }) => (
                <div key={recipe.id} className="flex flex-col gap-2">
                  <RecipeCard recipe={recipe} />
                  <p className="px-1 text-xs leading-relaxed text-muted-foreground">{reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <RecipeFiltersPanel filters={filters} onChange={setFilters} resultCount={recipes.length} />

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
