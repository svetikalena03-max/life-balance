import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SaveSuccess } from "@/components/SaveSuccess";
import { useEntries, todayISO } from "@/lib/store";

export const Route = createFileRoute("/_app/diary")({
  component: DiaryPage,
});

function DiaryPage() {
  const { entries, saveEntry, ready } = useEntries();
  const today = todayISO();
  const existing = entries.find((e) => e.date === today);

  const [food, setFood] = useState("");
  const [drinks, setDrinks] = useState("");
  const [wellbeing, setWellbeing] = useState("");
  const [weight, setWeight] = useState("");
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");
  const [breadUnits, setBreadUnits] = useState("");
  const [steps, setSteps] = useState("");
  const [workout, setWorkout] = useState("");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [mood, setMood] = useState(7);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setFood(existing.food ?? "");
      setDrinks(existing.drinks ?? "");
      setWellbeing(existing.wellbeing ?? "");
      setWeight(existing.weight != null ? String(existing.weight) : "");
      setWater(existing.water != null ? String(existing.water) : "");
      setSleep(existing.sleep != null ? String(existing.sleep) : "");
      setBreadUnits(existing.breadUnits != null ? String(existing.breadUnits) : "");
      setSteps(existing.steps != null ? String(existing.steps) : "");
      setWorkout(existing.workout ?? "");
      setWorkoutMinutes(existing.workoutMinutes != null ? String(existing.workoutMinutes) : "");
      setMood(existing.mood ?? 7);
    }
  }, [ready, existing?.date]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveEntry({
      date: today,
      food, drinks, wellbeing,
      weight: weight === "" ? undefined : Number(weight),
      water: water === "" ? undefined : Number(water),
      sleep: sleep === "" ? undefined : Number(sleep),
      breadUnits: breadUnits === "" ? undefined : Number(breadUnits),
      steps: steps === "" ? undefined : Number(steps),
      workout: workout || undefined,
      workoutMinutes: workoutMinutes === "" ? undefined : Number(workoutMinutes),
      mood,
    });
    toast.success("День сохранён");
    setSaved(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Дневник дня" subtitle="Запишите, как прошёл день" />

      {saved && (
        <SaveSuccess onContinue={() => setSaved(false)} />
      )}

      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="food">Что ел сегодня</Label>
            <Textarea id="food" rows={3} value={food} onChange={(e) => setFood(e.target.value)} placeholder="Завтрак, обед, ужин…" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="drinks">Что пил</Label>
            <Textarea id="drinks" rows={2} value={drinks} onChange={(e) => setDrinks(e.target.value)} placeholder="Вода, чай, кофе…" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="well">Самочувствие</Label>
            <Textarea id="well" rows={2} value={wellbeing} onChange={(e) => setWellbeing(e.target.value)} placeholder="Как себя чувствуете?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field id="w" label="Вес, кг" value={weight} setValue={setWeight} step="0.1" placeholder="70" />
            <Field id="water" label="Вода, мл" value={water} setValue={setWater} placeholder="2000" />
            <Field id="sleep" label="Часы сна" value={sleep} setValue={setSleep} step="0.1" placeholder="7.5" />
            <Field id="bu" label="Хлебцы, шт" value={breadUnits} setValue={setBreadUnits} placeholder="0" />
            <Field id="st" label="Шаги за день" value={steps} setValue={setSteps} placeholder="8000" />
            <Field id="wm" label="Время тренировки, мин" value={workoutMinutes} setValue={setWorkoutMinutes} placeholder="30" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="workout">Тренировка</Label>
            <Input id="workout" value={workout} onChange={(e) => setWorkout(e.target.value)} placeholder="Йога, бег, силовая…" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Настроение</Label>
              <span className="text-sm font-semibold text-primary">{mood}/10</span>
            </div>
            <Slider min={1} max={10} step={1} value={[mood]} onValueChange={(v) => setMood(v[0])} />
          </div>

          <Button type="submit" size="lg" className="mt-2 h-12 text-base font-semibold">
            Сохранить день
          </Button>
        </form>
      </Card>
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
