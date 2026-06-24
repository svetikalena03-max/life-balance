import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useProfile, type Gender, type Goal, GOAL_LABELS } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Баланс жизни — здоровье, питание, сон" },
      { name: "description", content: "Питание, здоровье, сон, энергия и хорошее самочувствие каждый день." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { profile, setProfile, ready } = useProfile();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [goal, setGoal] = useState<Goal>("health");

  useEffect(() => {
    if (ready && profile) navigate({ to: "/home" });
  }, [ready, profile, navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setProfile({
      name: name.trim() || "Друг",
      age: Number(age) || 30,
      gender,
      height: Number(height) || 170,
      currentWeight: Number(currentWeight) || 70,
      targetWeight: Number(targetWeight) || 70,
      waterGoal: 2000,
      goal,
    });
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-secondary via-background to-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Баланс жизни</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Питание, здоровье, сон, энергия и хорошее самочувствие каждый день.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Анна" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="age">Возраст</Label>
                <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Пол</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Женский</SelectItem>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="other">Другой</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="height">Рост, см</Label>
              <Input id="height" type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cw">Текущий вес, кг</Label>
                <Input id="cw" type="number" step="0.1" inputMode="decimal" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="70" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tw">Целевой вес, кг</Label>
                <Input id="tw" type="number" step="0.1" inputMode="decimal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="65" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Цель</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                    <SelectItem key={g} value={g}>{GOAL_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="lg" className="mt-2 h-12 text-base font-semibold">
              Начать
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Данные сохраняются на вашем устройстве
        </p>
      </div>
    </div>
  );
}
