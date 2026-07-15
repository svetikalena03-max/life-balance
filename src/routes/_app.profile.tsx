import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import {
  DEFAULT_PROFILE,
  deleteCurrentUserData,
  useProfile,
  type Gender,
  type Goal,
  GOAL_LABELS,
  summarizeHealthFeatures,
} from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { LogOut, ChevronRight, Heart, HeartPulse, Settings as SettingsIcon, ChefHat } from "lucide-react";


export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, setProfile, ready, error, retry } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [height, setHeight] = useState("");
  const [cw, setCw] = useState("");
  const [tw, setTw] = useState("");
  const [goal, setGoal] = useState<Goal>("health");
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

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

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Профиль" subtitle="Загружаем ваши данные" />
        <Card className="p-6 text-center text-sm text-muted-foreground">Загрузка профиля…</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Профиль" subtitle="Не удалось загрузить данные" />
        <Card className="flex flex-col gap-4 p-6 text-center">
          <p className="text-sm text-destructive">Ошибка загрузки профиля: {error}</p>
          <Button type="button" variant="outline" onClick={retry}>Повторить</Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    const createProfile = async () => {
      setCreating(true);
      const result = await setProfile({ ...DEFAULT_PROFILE });
      setCreating(false);
      if (result.ok) toast.success("Профиль создан. Заполните данные и сохраните изменения.");
      else toast.error(`Не удалось создать профиль: ${result.error}`);
    };
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Профиль" subtitle="Заполните основные данные" />
        <Card className="flex flex-col gap-4 p-6 text-center">
          <div>
            <p className="font-semibold">Профиль ещё не заполнен</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Создайте профиль, затем укажите имя, цель и параметры здоровья.
            </p>
          </div>
          <Button type="button" onClick={createProfile} disabled={creating}>
            {creating ? "Создаём профиль…" : "Создать и заполнить профиль"}
          </Button>
        </Card>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const age = birthDate
      ? Math.max(1, Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)))
      : profile.age;
    const result = await setProfile({
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
    if (result.ok) toast.success("Профиль обновлён");
    else toast.error(`Не удалось сохранить профиль: ${result.error}`);
  };

  void user;
  const reset = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const wipe = async () => {
    setDeleting(true);
    const result = await deleteCurrentUserData();
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error, { duration: 8000 });
      return;
    }
    localStorage.removeItem("hg_profile");
    localStorage.removeItem("hg_entries");
    localStorage.removeItem("hg_entries_v2");
    window.dispatchEvent(new CustomEvent("hg-storage"));
    toast.success("Все данные приложения удалены. Учётная запись сохранена.");
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

      <Link to="/recipes" className="block">
        <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <ChefHat className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Рецепты</p>
            <p className="text-xs text-muted-foreground">Подбор блюд по цели и особенностям здоровья</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      <Link to="/health-features" className="block">
        <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Особенности здоровья</p>
            <p className="truncate text-xs text-muted-foreground">
              {summarizeHealthFeatures(profile.healthFeatures)}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      <Link to="/habits" className="block">
        <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Heart className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Мои привычки</p>
            <p className="text-xs text-muted-foreground">Курение, алкоголь, кофе, стресс, экранное время</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      <Link to="/settings" className="block">
        <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Настройки приложения</p>
            <p className="text-xs text-muted-foreground">Тема, язык, отображение</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Card>
      </Link>

      <div className="grid gap-2">
        <Button variant="outline" onClick={reset} className="h-11">
          <LogOut className="mr-2 h-4 w-4" /> Выйти
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={deleting}
              className="text-center text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
            >
              {deleting ? "Удаляем данные…" : "Удалить все данные"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить все данные приложения?</AlertDialogTitle>
              <AlertDialogDescription>
                Будут безвозвратно удалены профиль, дневник, показатели здоровья, привычки и особенности здоровья.
                Учётная запись, вход и сохранённые юридические согласия останутся.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void wipe()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Да, удалить данные
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

