import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useProfile, type Gender, type Goal, GOAL_LABELS } from "@/lib/store";
import { LogOut, Mic, Sparkles, Utensils, Dumbbell, Bell, BrainCircuit, ChevronRight, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";


export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [height, setHeight] = useState("");
  const [cw, setCw] = useState("");
  const [tw, setTw] = useState("");
  const [goal, setGoal] = useState<Goal>("health");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBirthDate(profile.birthDate ?? "");
      setGender(profile.gender);
      setHeight(String(profile.height));
      setCw(String(profile.currentWeight));
      setTw(String(profile.targetWeight));
      setGoal(profile.goal ?? "health");
    }
  }, [profile?.name]);

  if (!profile) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const age = birthDate
      ? Math.max(1, Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)))
      : profile.age;
    setProfile({
      ...profile,
      name: name.trim() || profile.name,
      birthDate: birthDate || undefined,
      age,
      gender,
      height: Number(height) || profile.height,
      currentWeight: Number(cw) || profile.currentWeight,
      targetWeight: Number(tw) || profile.targetWeight,
      goal,
    });
    toast.success("Профиль обновлён");
  };

  const reset = () => {
    if (!confirm("Сбросить все данные?")) return;
    localStorage.removeItem("hg_profile");
    localStorage.removeItem("hg_entries");
    localStorage.removeItem("hg_entries_v2");
    window.dispatchEvent(new CustomEvent("hg-storage"));
    navigate({ to: "/" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Профиль" subtitle="Редактируйте свои данные" />

      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="bd">Дата рождения</Label>
              <Input id="bd" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
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
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="h">Рост, см</Label>
              <Input id="h" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="cw">Текущий вес</Label>
              <Input id="cw" type="number" step="0.1" value={cw} onChange={(e) => setCw(e.target.value)} />
            </div>
            <div className="col-span-2 flex min-w-0 flex-col gap-2">
              <Label htmlFor="tw">Целевой вес</Label>
              <Input id="tw" type="number" step="0.1" value={tw} onChange={(e) => setTw(e.target.value)} />
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

          <Button type="submit" size="lg" className="h-12 font-semibold">Сохранить</Button>
        </form>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Скоро в приложении</p>
        <ul className="grid gap-2 text-sm text-muted-foreground">
          <Soon icon={<Sparkles className="h-4 w-4" />} label="AI-анализ дня" />
          <Soon icon={<Utensils className="h-4 w-4" />} label="Меню на завтра" />
          <Soon icon={<BrainCircuit className="h-4 w-4" />} label="Персональные рекомендации" />
          <Soon icon={<Mic className="h-4 w-4" />} label="Голосовой дневник" />
          <Soon icon={<Dumbbell className="h-4 w-4" />} label="Тренировки" />
          <Soon icon={<Bell className="h-4 w-4" />} label="Напоминания" />
        </ul>
      </Card>

      <Button variant="outline" onClick={reset} className="h-11">
        <LogOut className="mr-2 h-4 w-4" /> Сбросить данные
      </Button>
    </div>
  );
}

function Soon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </li>
  );
}
