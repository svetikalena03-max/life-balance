import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_RECIPE_FILTERS,
  RECIPE_CONDITION_OPTIONS,
  RECIPE_GOAL_OPTIONS,
  RECIPE_TIME_OPTIONS,
  type RecipeFilters,
} from "@/lib/recipes";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Goal } from "@/lib/store";
import type { RecipeTimeFilter } from "@/lib/recipes/types";

export function RecipeFiltersPanel({
  filters,
  onChange,
  resultCount,
}: {
  filters: RecipeFilters;
  onChange: (next: RecipeFilters) => void;
  resultCount: number;
}) {
  const patch = (partial: Partial<RecipeFilters>) => onChange({ ...filters, ...partial });

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Поиск и фильтры</h2>
        </div>
        <span className="text-xs text-muted-foreground">Найдено: {resultCount}</span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          placeholder="Поиск по названию..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterSelect
          label="Заболевание"
          value={filters.condition}
          options={RECIPE_CONDITION_OPTIONS}
          onValueChange={(v) => patch({ condition: v })}
        />
        <FilterSelect
          label="Цель"
          value={filters.goal}
          options={RECIPE_GOAL_OPTIONS}
          onValueChange={(v) => patch({ goal: v as Goal | "all" })}
        />
        <FilterSelect
          label="Время приготовления"
          value={String(filters.maxMinutes)}
          options={RECIPE_TIME_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          onValueChange={(v) =>
            patch({ maxMinutes: (v === "all" ? "all" : Number(v)) as RecipeTimeFilter })
          }
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="ingredient-search">Ингредиент</Label>
          <Input
            id="ingredient-search"
            value={filters.ingredientQuery}
            onChange={(e) => patch({ ingredientQuery: e.target.value })}
            placeholder="Например: курица, овсянка..."
          />
        </div>
      </div>

      {(filters.query || filters.condition !== "all" || filters.goal !== "all" || filters.maxMinutes !== "all" || filters.ingredientQuery) && (
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_RECIPE_FILTERS })}
          className="text-left text-xs text-primary underline-offset-2 hover:underline"
        >
          Сбросить фильтры
        </button>
      )}
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
