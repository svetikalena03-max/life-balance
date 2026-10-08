import type { Recipe } from "@/lib/recipes";
import { Clock, Flame } from "lucide-react";

export function RecipeImage({
  recipe,
  className = "",
}: {
  recipe: Recipe;
  className?: string;
}) {
  return (
    <img
      src={recipe.imageUrl}
      alt={recipe.title}
      loading="lazy"
      decoding="async"
      className={`aspect-[4/3] w-full rounded-2xl object-cover ${className}`}
    />
  );
}

export function RecipeMacrosBadges({ macros }: { macros: Recipe["macros"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full bg-chart-1/15 px-2 py-0.5 text-[11px] font-medium text-chart-1">
        Б ≈{macros.protein} г
      </span>
      <span className="rounded-full bg-chart-4/15 px-2 py-0.5 text-[11px] font-medium text-chart-4">
        Ж ≈{macros.fat} г
      </span>
      <span className="rounded-full bg-chart-2/15 px-2 py-0.5 text-[11px] font-medium text-chart-2">
        У ≈{macros.carbs} г
      </span>
    </div>
  );
}

export function RecipeMetaRow({ recipe }: { recipe: Recipe }) {
  const totalMin = recipe.prepMinutes + recipe.cookMinutes;
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        {totalMin} мин
      </span>
      <span className="inline-flex items-center gap-1">
        <Flame className="h-3.5 w-3.5" />
        ≈{recipe.calories} ккал
      </span>
      <span>{recipe.servings} порц.</span>
    </div>
  );
}
