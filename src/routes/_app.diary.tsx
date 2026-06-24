import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, todayISO } from "@/lib/store";

export const Route = createFileRoute("/_app/diary")({
  component: DiaryPage,
});

function DiaryPage() {
  const { entries, saveEntry, ready } = useEntries();
  const navigate = useNavigate();
  const today = todayISO();
  const existing = entries.find((e) => e.date === today);

  const [food, setFood] = useState("");
  const [drinks, setDrinks] = useState("");
  const [wellbeing, setWellbeing] = useState("");
  const [weight, setWeight] = useState("");
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");
  const [mood, setMood] = useState(7);

  useEffect(() => {
    if (existing) {
      setFood(existing.food);
      setDrinks(existing.drinks);
      setWellbeing(existing.wellbeing);
      setWeight(String(existing.weight));
      setWater(String(existing.water));
      setSleep(String(existing.sleep));
      setMood(existing.mood);
    }
  }, [ready, existing?.date]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveEntry({
      date: today,
      food, drinks, wellbeing,
      weight: Number(weight) || 0,
      water: Number(water) || 0,
      sleep: Number(sleep) || 0,
      mood,
    });
    toast.success("День сохранён");
    navigate({ to: "/history" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Дневник дня" subtitle="Запишите, как прошёл день" />

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
            <div className="flex flex-col gap-2">
              <Label htmlFor="w">Вес сегодня, кг</Label>
              <Input id="w" type="number" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="water">Вода, мл</Label>
              <Input id="water" type="number" inputMode="numeric" value={water} onChange={(e) => setWater(e.target.value)} placeholder="2000" />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="sleep">Часы сна</Label>
              <Input id="sleep" type="number" step="0.1" inputMode="decimal" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" />
            </div>
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
