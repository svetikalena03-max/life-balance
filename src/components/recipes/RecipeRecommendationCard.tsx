import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Recipe } from "@/lib/recipes";
import { Sparkles } from "lucide-react";
import { RecipeMacrosBadges, RecipeMetaRow, RecipePlaceholderImage } from "./RecipeMedia";

export function RecipeRecommendationCard({
  recipe,
  reason,
}: {
  recipe: Recipe;
  reason: string;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-primary/20 shadow-sm">
      <RecipePlaceholderImage
        emoji={recipe.imageEmoji}
        gradient={recipe.imageGradient}
        className="rounded-none"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">{recipe.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
        </div>

        <RecipeMetaRow recipe={recipe} />
        <RecipeMacrosBadges macros={recipe.macros} />

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Почему AI рекомендует
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{reason}</p>
        </div>

        <Button asChild className="mt-auto w-full">
          <Link to="/recipes/$id" params={{ id: recipe.id }}>
            Открыть рецепт
          </Link>
        </Button>
      </div>
    </Card>
  );
}
