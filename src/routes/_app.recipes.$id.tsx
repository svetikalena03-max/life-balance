import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { RecipeMacrosBadges, RecipeMetaRow, RecipePlaceholderImage } from "@/components/recipes/RecipeMedia";
import { findRecipeById } from "@/lib/recipes";
import { GOAL_LABELS, CHRONIC_OPTIONS } from "@/lib/store";
import { Clock, ListOrdered, ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/_app/recipes/$id")({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { id } = Route.useParams();
  const recipe = findRecipeById(id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!recipe) navigate({ to: "/recipes" });
  }, [recipe, navigate]);

  if (!recipe) return null;

  const conditionLabels = recipe.tags.conditions
    .map((c) => CHRONIC_OPTIONS.find(([k]) => k === c)?.[1] ?? c)
    .join(", ");

  const goalLabels = recipe.tags.goals.map((g) => GOAL_LABELS[g]).join(", ");

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <PageHeader title={recipe.title} backTo="/recipes" />

      <RecipePlaceholderImage emoji={recipe.imageEmoji} gradient={recipe.imageGradient} />

      <Card className="p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
        <div className="mt-3">
          <RecipeMetaRow recipe={recipe} />
        </div>
        <div className="mt-3">
          <RecipeMacrosBadges macros={recipe.macros} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-foreground">Подходит для</h2>
        <dl className="mt-2 grid gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Цели</dt>
            <dd className="text-foreground">{goalLabels}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Заболевания</dt>
            <dd className="text-foreground">{conditionLabels}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Время</dt>
            <dd className="inline-flex items-center gap-1 text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Подготовка {recipe.prepMinutes} мин · готовка {recipe.cookMinutes} мин
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingBasket className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Ингредиенты</h2>
          <span className="text-xs text-muted-foreground">на {recipe.servings} порц.</span>
        </div>
        <ul className="flex flex-col gap-2">
          {recipe.ingredients.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="text-foreground">
                {item.name}
                {item.optional && <span className="ml-1 text-xs text-muted-foreground">(по желанию)</span>}
              </span>
              <span className="shrink-0 text-muted-foreground">{item.amount}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Приготовление</h2>
        </div>
        <ol className="flex flex-col gap-3">
          {recipe.steps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.order} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {step.order}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-foreground">{step.text}</p>
              </li>
            ))}
        </ol>
      </Card>
    </div>
  );
}
