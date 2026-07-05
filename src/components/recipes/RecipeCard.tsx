import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import type { Recipe } from "@/lib/recipes";
import { RecipeMacrosBadges, RecipeMetaRow, RecipePlaceholderImage } from "./RecipeMedia";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to="/recipes/$id" params={{ id: recipe.id }} className="group block">
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <RecipePlaceholderImage emoji={recipe.imageEmoji} gradient={recipe.imageGradient} className="rounded-none" />
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
            {recipe.title}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">{recipe.description}</p>
          <RecipeMetaRow recipe={recipe} />
          <RecipeMacrosBadges macros={recipe.macros} />
        </div>
      </Card>
    </Link>
  );
}
