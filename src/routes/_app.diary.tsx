import { createFileRoute, useRouterState, useBlocker } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, Brain, Copy, BookmarkPlus, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SaveSuccess } from "@/components/SaveSuccess";
import { analyzeMeal, type AnalyzeMealResult } from "@/lib/ai.functions";
import {
  addMealTemplate,
  extractYesterdayCopy,
  loadMealTemplates,
  yesterdayISO,
  type MealTemplate,
  type YesterdayCopyPayload,
} from "@/lib/diary-quick-input";
import {
  useEntries,
  useProfile,
  todayISO,
  DEFAULT_MEAL_TYPES,
  MEAL_LABELS,
  SUGAR_LABELS,
  GOAL_LABELS,
  summarizeHealthFeatures,
  type Meal,
  type MealType,
  type SugarLevel,
} from "@/lib/store";

export const Route = createFileRoute("/_app/diary")({
  component: DiaryPage,
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

function makeEmptyMeals(): Meal[] {
  return DEFAULT_MEAL_TYPES.map((t) => ({ id: newId(), type: t }));
}

function restoreMealSlots(savedMeals: Meal[]): Meal[] {
  const remaining = [...savedMeals];
  const standardMeals = DEFAULT_MEAL_TYPES.map((type) => {
    const savedIndex = remaining.findIndex((meal) => meal.type === type);
    if (savedIndex < 0) return { id: newId(), type };

    const [savedMeal] = remaining.splice(savedIndex, 1);
    return savedMeal;
  });

  return [...standardMeals, ...remaining];
}

function buildMealDescription(meal: Meal): string {
  return [meal.food, meal.portion && `порция: ${meal.portion}`, meal.comment]
    .filter(Boolean)
    .join(", ");
}

function DiaryPage() {
  const { entries, saveEntry, ready, saving } = useEntries();
  const today = todayISO();
  const existing = entries.find((e) => e.date === today);
  const yesterdayEntry = entries.find((e) => e.date === yesterdayISO());

  const [meals, setMeals] = useState<Meal[]>(makeEmptyMeals);
  const [wellbeing, setWellbeing] = useState("");
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [breadUnits, setBreadUnits] = useState("");
  const [steps, setSteps] = useState("");
  const [workout, setWorkout] = useState("");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [mood, setMood] = useState<number | undefined>(undefined);
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
  const [templates, setTemplates] = useState<MealTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadMealTemplates());
  }, []);

  const hydrated = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);
  const snapshot = JSON.stringify({
    meals,
    wellbeing,
    weight,
    sleep,
    breadUnits,
    steps,
    workout,
    workoutMinutes,
    mood,
    water,
    tea,
    coffee,
    soda,
    juice,
    otherDrinks,
    sugar,
    sugarOther,
    milk,
  });
  const dirty = baseline !== null && baseline !== snapshot;
  useBlocker({
    shouldBlockFn: () =>
      dirty && !window.confirm("Изменения дневника не сохранены. Уйти без сохранения?"),
    enableBeforeUnload: dirty,
  });
  useEffect(() => {
    if (initialized && baseline === null) setBaseline(snapshot);
  }, [initialized, baseline, snapshot]);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    setInitialized(true);
    if (!existing) return;
    if (existing.meals && existing.meals.length > 0) {
      setMeals(restoreMealSlots(existing.meals));
    }
    setWellbeing(existing.wellbeing ?? "");
    setWeight(existing.weight != null ? String(existing.weight) : "");
    setSleep(existing.sleep != null ? String(existing.sleep) : "");
    setBreadUnits(existing.breadUnits != null ? String(existing.breadUnits) : "");
    setSteps(existing.steps != null ? String(existing.steps) : "");
    setWorkout(existing.workout ?? "");
    setWorkoutMinutes(existing.workoutMinutes != null ? String(existing.workoutMinutes) : "");
    setMood(existing.mood ?? undefined);
    setWater(existing.water != null ? String(existing.water) : "");
    setTea(existing.tea != null ? String(existing.tea) : "");
    setCoffee(existing.coffee != null ? String(existing.coffee) : "");
    setSoda(existing.soda != null ? String(existing.soda) : "");
    setJuice(existing.juice != null ? String(existing.juice) : "");
    setOtherDrinks(existing.otherDrinks ?? "");
    setSugar(existing.sugar ?? "none");
    setSugarOther(existing.sugarOther ?? "");
    setMilk(!!existing.milk);
  }, [ready, existing]);

  const applyYesterdayPayload = (payload: YesterdayCopyPayload) => {
    if (payload.meals?.length) setMeals(restoreMealSlots(payload.meals));
    if (payload.wellbeing != null) setWellbeing(payload.wellbeing);
    if (payload.breadUnits != null) setBreadUnits(String(payload.breadUnits));
    if (payload.steps != null) setSteps(String(payload.steps));
    if (payload.workout != null) setWorkout(payload.workout);
    if (payload.workoutMinutes != null) setWorkoutMinutes(String(payload.workoutMinutes));
    if (payload.mood != null) setMood(payload.mood);
    if (payload.water != null) setWater(String(payload.water));
    if (payload.tea != null) setTea(String(payload.tea));
    if (payload.coffee != null) setCoffee(String(payload.coffee));
    if (payload.soda != null) setSoda(String(payload.soda));
    if (payload.juice != null) setJuice(String(payload.juice));
    if (payload.otherDrinks != null) setOtherDrinks(payload.otherDrinks);
    if (payload.sugar != null) setSugar(payload.sugar);
    if (payload.sugarOther != null) setSugarOther(payload.sugarOther);
    if (payload.milk != null) setMilk(payload.milk);
  };

  const copyYesterday = () => {
    const payload = extractYesterdayCopy(yesterdayEntry);
    if (!payload) {
      toast.error("За вчера нет записей для копирования");
      return;
    }
    applyYesterdayPayload(payload);
    toast.success("Данные за вчера подставлены — проверьте и сохраните");
  };

  const applyTemplate = (tpl: MealTemplate) => {
    setMeals((prev) => {
      const emptyIdx = prev.findIndex((m) => !m.food?.trim());
      if (emptyIdx >= 0) {
        return prev.map((m, i) =>
          i === emptyIdx ? { ...m, food: tpl.food, portion: tpl.portion ?? m.portion } : m,
        );
      }
      return [...prev, { id: newId(), type: "extra", food: tpl.food, portion: tpl.portion }];
    });
    toast.success(`Добавлено: ${tpl.label}`);
  };

  const saveCurrentMealAsTemplate = (filled: Meal) => {
    if (!filled?.food?.trim()) {
      toast.error("Сначала заполните хотя бы один приём пищи");
      return;
    }
    const label = filled.food.trim().slice(0, 24);
    const next = addMealTemplate({
      label,
      food: filled.food.trim(),
      portion: filled.portion?.trim() || undefined,
    });
    setTemplates(next);
    toast.success("Блюдо сохранено в шаблоны");
  };

  const updateMeal = (id: string, patch: Partial<Meal>) =>
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMeal = (id: string) => setMeals((prev) => prev.filter((m) => m.id !== id));
  const addMeal = () => setMeals((prev) => [...prev, { id: newId(), type: "extra" }]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || baseline === null) return;
    const cleanMeals = meals.filter(
      (m) =>
        (m.food && m.food.trim()) ||
        (m.portion && m.portion.trim()) ||
        (m.comment && m.comment.trim()) ||
        m.time,
    );
    const result = await saveEntry({
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

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("День сохранён");
    setBaseline(snapshot);
    setSaved(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Дневник дня" subtitle="Запишите, как прошёл день" />
      <p className="text-sm text-muted-foreground">
        Не нужно заполнять всё. Выберите то, что хотите отслеживать сегодня.
      </p>

      {saved && <SaveSuccess onContinue={() => setSaved(false)} />}

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 gap-2"
            onClick={copyYesterday}
            disabled={!yesterdayEntry || saving || baseline === null}
          >
            <Copy className="h-4 w-4" />
            Скопировать вчера
          </Button>
        </div>
      </Card>

      {templates.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Быстрые шаблоны</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Нажмите, чтобы добавить блюдо в первый свободный приём пищи.
          </p>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <Button
                key={tpl.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto py-1.5"
                onClick={() => applyTemplate(tpl)}
                disabled={saving || baseline === null}
              >
                {tpl.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={saving}>
        <fieldset disabled={saving || baseline === null} className="contents">
          <DiarySection title="Приёмы пищи" targets={[]} initiallyOpen>
            <div className="flex flex-col gap-3">
              {meals.map((m, idx) => (
                <MealBlock
                  key={m.id}
                  meal={m}
                  index={idx}
                  onChange={(patch) => updateMeal(m.id, patch)}
                  onRemove={() => removeMeal(m.id)}
                  onRemember={() => saveCurrentMealAsTemplate(m)}
                  canRemove={meals.length > 1}
                  disabled={saving}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={addMeal}
              className="mt-3 h-11 w-full"
              disabled={saving}
            >
              <Plus className="mr-1 h-4 w-4" /> Добавить ещё приём пищи
            </Button>
          </DiarySection>

          <DiarySection title="Напитки" targets={["water", "tea", "coffee", "soda", "juice"]}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="water"
                label="Вода, мл"
                value={water}
                setValue={setWater}
                placeholder="2000"
                disabled={saving}
              />
              <Field
                id="tea"
                label="Чай, мл"
                value={tea}
                setValue={setTea}
                placeholder="400"
                disabled={saving}
              />
              <Field
                id="coffee"
                label="Кофе, мл"
                value={coffee}
                setValue={setCoffee}
                placeholder="200"
                disabled={saving}
              />
              <Field
                id="soda"
                label="Газировка, мл"
                value={soda}
                setValue={setSoda}
                placeholder="0"
                disabled={saving}
              />
              <Field
                id="juice"
                label="Сок, мл"
                value={juice}
                setValue={setJuice}
                placeholder="0"
                disabled={saving}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <Label>Сахар</Label>
                <Select
                  value={sugar}
                  onValueChange={(v) => setSugar(v as SugarLevel)}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUGAR_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sugar === "other" && (
              <div className="mt-3 flex flex-col gap-2">
                <Label htmlFor="sugarOther">Уточните количество сахара</Label>
                <Input
                  id="sugarOther"
                  value={sugarOther}
                  onChange={(e) => setSugarOther(e.target.value)}
                  placeholder="например, 3 ложки"
                  disabled={saving}
                />
              </div>
            )}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Молоко / сливки</Label>
              <Switch checked={milk} onCheckedChange={setMilk} disabled={saving} />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="other">Другие напитки</Label>
              <Input
                id="other"
                value={otherDrinks}
                onChange={(e) => setOtherDrinks(e.target.value)}
                placeholder="кефир, морс…"
                disabled={saving}
              />
            </div>
          </DiarySection>

          <DiarySection
            title="Показатели дня"
            targets={["w", "bu", "sl", "st", "wm", "well", "mood"]}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="w"
                label="Вес, кг"
                value={weight}
                setValue={setWeight}
                step="0.1"
                placeholder="70"
                disabled={saving}
              />
              <Field
                id="bu"
                label="Хлебцы за день, шт"
                value={breadUnits}
                setValue={setBreadUnits}
                placeholder="0"
                disabled={saving}
              />
              <Field
                id="sl"
                label="Часы сна"
                value={sleep}
                setValue={setSleep}
                step="0.1"
                placeholder="7.5"
                disabled={saving}
              />
              <Field
                id="st"
                label="Шаги"
                value={steps}
                setValue={setSteps}
                placeholder="8000"
                disabled={saving}
              />
              <Field
                id="wm"
                label="Тренировка, мин"
                value={workoutMinutes}
                setValue={setWorkoutMinutes}
                placeholder="30"
                disabled={saving}
              />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="workout">Какая тренировка</Label>
              <Input
                id="workout"
                value={workout}
                onChange={(e) => setWorkout(e.target.value)}
                placeholder="Йога, бег, силовая…"
                disabled={saving}
              />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="well">Самочувствие</Label>
              <Textarea
                id="well"
                rows={2}
                value={wellbeing}
                onChange={(e) => setWellbeing(e.target.value)}
                placeholder="Как себя чувствуете?"
                disabled={saving}
              />
            </div>
            <div id="mood" className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Настроение</Label>
                <span className="text-sm font-semibold text-primary">
                  {mood != null ? `${mood}/10` : "Не отмечено"}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Оценка настроения от 1 до 10"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mood === value ? "default" : "outline"}
                    aria-pressed={mood === value}
                    className="h-11 w-11 p-0"
                    onClick={() => setMood(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          </DiarySection>
        </fieldset>
        <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 rounded-xl border bg-background/95 p-3 shadow-lg">
          <p className="mb-2 text-center text-xs text-muted-foreground" role="status">
            {saving
              ? "Сохраняем…"
              : dirty
                ? "Есть несохранённые изменения"
                : saved
                  ? "Изменения сохранены"
                  : "Заполните нужные поля и сохраните"}
          </p>
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={saving || baseline === null || !dirty}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MealBlock({
  meal,
  onChange,
  onRemove,
  onRemember,
  canRemove,
  disabled,
}: {
  meal: Meal;
  index: number;
  onChange: (patch: Partial<Meal>) => void;
  onRemove: () => void;
  onRemember: () => void;
  canRemove: boolean;
  disabled?: boolean;
}) {
  const baseId = `meal-${meal.id}`;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {MEAL_LABELS[meal.type]}
        </p>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 px-2 text-muted-foreground"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-food`} className="text-xs text-muted-foreground">
          Что ел
        </Label>
        <Textarea
          id={`${baseId}-food`}
          rows={2}
          value={meal.food ?? ""}
          onChange={(e) => onChange({ food: e.target.value })}
          placeholder="Каша, омлет, фрукты…"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={`${baseId}-portion`} className="text-xs text-muted-foreground">
            Количество / порция
          </Label>
          <Input
            id={`${baseId}-portion`}
            value={meal.portion ?? ""}
            onChange={(e) => onChange({ portion: e.target.value })}
            placeholder="200 г / 1 тарелка"
            disabled={disabled}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={`${baseId}-time`} className="text-xs text-muted-foreground">
            Время
          </Label>
          <Input
            id={`${baseId}-time`}
            type="time"
            value={meal.time ?? ""}
            onChange={(e) => onChange({ time: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-comment`} className="text-xs text-muted-foreground">
          Комментарий
        </Label>
        <Input
          id={`${baseId}-comment`}
          value={meal.comment ?? ""}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Ощущения, ингредиенты…"
          disabled={disabled}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !meal.food?.trim()}
        onClick={onRemember}
      >
        <BookmarkPlus className="mr-2 h-4 w-4" />
        Запомнить блюдо
      </Button>
      <MealAiAnalysis meal={meal} disabled={disabled} />
    </div>
  );
}

function MealAiAnalysis({ meal, disabled }: { meal: Meal; disabled?: boolean }) {
  const analyzeMealFn = useServerFn(analyzeMeal);
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeMealResult | null>(null);

  const runAnalyze = async () => {
    const foodText = buildMealDescription(meal);
    if (!foodText.trim()) {
      toast.error("Сначала укажите, что было съедено");
      return;
    }
    if (!profile || profile.age <= 0 || profile.height <= 0 || profile.currentWeight <= 0) {
      toast.error("Заполните профиль (возраст, рост, вес) для AI-анализа");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await analyzeMealFn({
        data: {
          foodText,
          age: profile.age,
          height: profile.height,
          weight: profile.currentWeight,
          goal: profile.goal ? GOAL_LABELS[profile.goal] : GOAL_LABELS.health,
          diseases: summarizeHealthFeatures(profile.healthFeatures),
        },
      });
      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось выполнить AI-анализ",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-2"
        onClick={runAnalyze}
        disabled={loading || disabled}
      >
        <Brain className="h-4 w-4" />
        {loading ? "AI-анализ..." : "AI-анализ"}
      </Button>

      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertTitle>AI недоступен</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {result?.ok && (
        <Alert>
          <AlertTitle>Оценка приёма пищи</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{result.summary}</span>
            {result.recommendations.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {result.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  setValue,
  step,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  setValue: (v: string) => void;
  step?: string;
  placeholder?: string;
  disabled?: boolean;
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
        disabled={disabled}
      />
    </div>
  );
}

function DiarySection({
  title,
  targets,
  initiallyOpen = false,
  children,
}: {
  title: string;
  targets: string[];
  initiallyOpen?: boolean;
  children: React.ReactNode;
}) {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const targeted = targets.includes(hash);
  const [open, setOpen] = useState(initiallyOpen || targeted);
  useEffect(() => {
    if (targeted) setOpen(true);
  }, [hash, targeted]);
  useEffect(() => {
    if (!open || !targeted) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(hash)?.scrollIntoView({ block: "center" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash, open, targeted]);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-3 p-5 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {title}
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div hidden={!open} className="px-5 pb-5">
        {children}
      </div>
    </Card>
  );
}
