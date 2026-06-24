import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SaveSuccess } from "@/components/SaveSuccess";
import {
  useEntries,
  todayISO,
  DEFAULT_MEAL_TYPES,
  MEAL_LABELS,
  SUGAR_LABELS,
  type Meal,
  type MealType,
  type SugarLevel,
} from "@/lib/store";

export const Route = createFileRoute("/_app/diary")({
  component: DiaryPage,
});

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

function makeEmptyMeals(): Meal[] {
  return DEFAULT_MEAL_TYPES.map((t) => ({ id: newId(), type: t }));
}

function DiaryPage() {
  const { entries, saveEntry, ready } = useEntries();
  const today = todayISO();
  const existing = entries.find((e) => e.date === today);

  const [meals, setMeals] = useState<Meal[]>(makeEmptyMeals);
  const [wellbeing, setWellbeing] = useState("");
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [breadUnits, setBreadUnits] = useState("");
  const [steps, setSteps] = useState("");
  const [workout, setWorkout] = useState("");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [mood, setMood] = useState(7);

  // Напитки
  const [water, setWater] = useState("");
  const [tea, setTea] = useState("");
  const [coffee, setCoffee] = useState("");
  const [soda, setSoda] = useState("");
  const [juice, setJuice] = useState("");
  const [otherDrinks, setOtherDrinks] = useState("");
  const [sugar, setSugar] = useState<SugarLevel>("none");
  const [sugarOther, setSugarOther] = useState("");
  const [milk, setMilk] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    if (existing.meals && existing.meals.length > 0) {
      setMeals(existing.meals);
    }
    setWellbeing(existing.wellbeing ?? "");
    setWeight(existing.weight != null ? String(existing.weight) : "");
    setSleep(existing.sleep != null ? String(existing.sleep) : "");
    setBreadUnits(existing.breadUnits != null ? String(existing.breadUnits) : "");
    setSteps(existing.steps != null ? String(existing.steps) : "");
    setWorkout(existing.workout ?? "");
    setWorkoutMinutes(existing.workoutMinutes != null ? String(existing.workoutMinutes) : "");
    setMood(existing.mood ?? 7);
    setWater(existing.water != null ? String(existing.water) : "");
    setTea(existing.tea != null ? String(existing.tea) : "");
    setCoffee(existing.coffee != null ? String(existing.coffee) : "");
    setSoda(existing.soda != null ? String(existing.soda) : "");
    setJuice(existing.juice != null ? String(existing.juice) : "");
    setOtherDrinks(existing.otherDrinks ?? "");
    setSugar(existing.sugar ?? "none");
    setSugarOther(existing.sugarOther ?? "");
    setMilk(!!existing.milk);
  }, [ready, existing?.date]);

  const updateMeal = (id: string, patch: Partial<Meal>) =>
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMeal = (id: string) => setMeals((prev) => prev.filter((m) => m.id !== id));
  const addMeal = () => setMeals((prev) => [...prev, { id: newId(), type: "extra" }]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cleanMeals = meals.filter(
      (m) => (m.food && m.food.trim()) || (m.portion && m.portion.trim()) || (m.comment && m.comment.trim()) || m.time,
    );
    saveEntry({
      date: today,
      meals: cleanMeals,
      wellbeing,
      weight: weight === "" ? undefined : Number(weight),
      sleep: sleep === "" ? undefined : Number(sleep),
      breadUnits: breadUnits === "" ? undefined : Number(breadUnits),
      steps: steps === "" ? undefined : Number(steps),
      workout: workout || undefined,
      workoutMinutes: workoutMinutes === "" ? undefined : Number(workoutMinutes),
      mood,
      water: water === "" ? undefined : Number(water),
      tea: tea === "" ? undefined : Number(tea),
      coffee: coffee === "" ? undefined : Number(coffee),
      soda: soda === "" ? undefined : Number(soda),
      juice: juice === "" ? undefined : Number(juice),
      otherDrinks: otherDrinks || undefined,
      sugar,
      sugarOther: sugar === "other" ? sugarOther || undefined : undefined,
      milk,
    });
    toast.success("День сохранён");
    setSaved(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Дневник дня" subtitle="Запишите, как прошёл день" />

      {saved && <SaveSuccess onContinue={() => setSaved(false)} />}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Приёмы пищи */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Приёмы пищи</h2>
          </div>
          <div className="flex flex-col gap-3">
            {meals.map((m, idx) => (
              <MealBlock
                key={m.id}
                meal={m}
                index={idx}
                onChange={(patch) => updateMeal(m.id, patch)}
                onRemove={() => removeMeal(m.id)}
                canRemove={meals.length > 1}
              />
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addMeal} className="mt-3 h-11 w-full">
            <Plus className="mr-1 h-4 w-4" /> Добавить ещё приём пищи
          </Button>
        </Card>

        {/* Напитки */}
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold">Напитки</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field id="water" label="Вода, мл" value={water} setValue={setWater} placeholder="2000" />
            <Field id="tea" label="Чай, мл" value={tea} setValue={setTea} placeholder="400" />
            <Field id="coffee" label="Кофе, мл" value={coffee} setValue={setCoffee} placeholder="200" />
            <Field id="soda" label="Газировка, мл" value={soda} setValue={setSoda} placeholder="0" />
            <Field id="juice" label="Сок, мл" value={juice} setValue={setJuice} placeholder="0" />
            <div className="flex min-w-0 flex-col gap-2">
              <Label>Сахар</Label>
              <Select value={sugar} onValueChange={(v) => setSugar(v as SugarLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SUGAR_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {sugar === "other" && (
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="sugarOther">Уточните количество сахара</Label>
              <Input id="sugarOther" value={sugarOther} onChange={(e) => setSugarOther(e.target.value)} placeholder="например, 3 ложки" />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="text-sm">Молоко / сливки</Label>
            <Switch checked={milk} onCheckedChange={setMilk} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="other">Другие напитки</Label>
            <Input id="other" value={otherDrinks} onChange={(e) => setOtherDrinks(e.target.value)} placeholder="кефир, морс…" />
          </div>
        </Card>

        {/* Прочее */}
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold">Показатели дня</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field id="w" label="Вес, кг" value={weight} setValue={setWeight} step="0.1" placeholder="70" />
            <Field id="bu" label="Хлебцы за день, шт" value={breadUnits} setValue={setBreadUnits} placeholder="0" />
            <Field id="sl" label="Часы сна" value={sleep} setValue={setSleep} step="0.1" placeholder="7.5" />
            <Field id="st" label="Шаги" value={steps} setValue={setSteps} placeholder="8000" />
            <Field id="wm" label="Тренировка, мин" value={workoutMinutes} setValue={setWorkoutMinutes} placeholder="30" />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="workout">Какая тренировка</Label>
            <Input id="workout" value={workout} onChange={(e) => setWorkout(e.target.value)} placeholder="Йога, бег, силовая…" />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="well">Самочувствие</Label>
            <Textarea id="well" rows={2} value={wellbeing} onChange={(e) => setWellbeing(e.target.value)} placeholder="Как себя чувствуете?" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Настроение</Label>
              <span className="text-sm font-semibold text-primary">{mood}/10</span>
            </div>
            <Slider min={1} max={10} step={1} value={[mood]} onValueChange={(v) => setMood(v[0])} />
          </div>
        </Card>

        <Button type="submit" size="lg" className="h-12 text-base font-semibold">
          Сохранить день
        </Button>
      </form>
    </div>
  );
}

function MealBlock({
  meal, onChange, onRemove, canRemove,
}: {
  meal: Meal;
  index: number;
  onChange: (patch: Partial<Meal>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const baseId = `meal-${meal.id}`;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {MEAL_LABELS[meal.type]}
        </p>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-8 px-2 text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-food`} className="text-xs text-muted-foreground">Что ел</Label>
        <Textarea
          id={`${baseId}-food`}
          rows={2}
          value={meal.food ?? ""}
          onChange={(e) => onChange({ food: e.target.value })}
          placeholder="Каша, омлет, фрукты…"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={`${baseId}-portion`} className="text-xs text-muted-foreground">Количество / порция</Label>
          <Input
            id={`${baseId}-portion`}
            value={meal.portion ?? ""}
            onChange={(e) => onChange({ portion: e.target.value })}
            placeholder="200 г / 1 тарелка"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={`${baseId}-time`} className="text-xs text-muted-foreground">Время</Label>
          <Input
            id={`${baseId}-time`}
            type="time"
            value={meal.time ?? ""}
            onChange={(e) => onChange({ time: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-comment`} className="text-xs text-muted-foreground">Комментарий</Label>
        <Input
          id={`${baseId}-comment`}
          value={meal.comment ?? ""}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Ощущения, ингредиенты…"
        />
      </div>
    </div>
  );
}

function Field({
  id, label, value, setValue, step, placeholder,
}: {
  id: string; label: string; value: string; setValue: (v: string) => void; step?: string; placeholder?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        inputMode={step ? "decimal" : "numeric"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
