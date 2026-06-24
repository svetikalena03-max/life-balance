import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useProfile } from "@/lib/store";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [cw, setCw] = useState("");
  const [tw, setTw] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(String(profile.age));
      setHeight(String(profile.height));
      setCw(String(profile.currentWeight));
      setTw(String(profile.targetWeight));
    }
  }, [profile?.name]);

  if (!profile) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: name.trim() || profile.name,
      age: Number(age) || profile.age,
      height: Number(height) || profile.height,
      currentWeight: Number(cw) || profile.currentWeight,
      targetWeight: Number(tw) || profile.targetWeight,
    });
    toast.success("Профиль обновлён");
  };

  const reset = () => {
    if (!confirm("Сбросить все данные?")) return;
    localStorage.removeItem("hg_profile");
    localStorage.removeItem("hg_entries");
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="age">Возраст</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="h">Рост, см</Label>
              <Input id="h" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cw">Текущий вес</Label>
              <Input id="cw" type="number" step="0.1" value={cw} onChange={(e) => setCw(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tw">Целевой вес</Label>
              <Input id="tw" type="number" step="0.1" value={tw} onChange={(e) => setTw(e.target.value)} />
            </div>
          </div>
          <Button type="submit" size="lg" className="h-12 font-semibold">Сохранить</Button>
        </form>
      </Card>

      <Card className="p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Скоро в приложении</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Голосовой ввод записей</li>
          <li>AI-аналитика самочувствия</li>
          <li>Меню на завтра</li>
          <li>Тренировки</li>
          <li>Подписка и админ-панель</li>
        </ul>
      </Card>

      <Button variant="outline" onClick={reset} className="h-11">
        <LogOut className="mr-2 h-4 w-4" /> Сбросить данные
      </Button>
    </div>
  );
}
