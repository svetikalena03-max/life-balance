import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useProfile, type Habits } from "@/lib/store";

export const Route = createFileRoute("/_app/habits")({
  component: HabitsPage,
});

type OptList = ReadonlyArray<readonly [string, string]>;

const SMOKING: OptList = [["no", "Не курю"], ["sometimes", "Иногда"], ["daily", "Ежедневно"]];
const VAPE: OptList = [["no", "Нет"], ["sometimes", "Иногда"], ["daily", "Ежедневно"]];
const ALCOHOL: OptList = [["no", "Не употребляю"], ["rare", "Редко"], ["weekly", "1–2 раза в неделю"], ["often", "Часто"]];
const COFFEE: OptList = [["no", "Не пью"], ["one", "1 чашка"], ["two", "2 чашки"], ["three_plus", "3+"]];
const TEA_SUGAR: OptList = [["without", "Без сахара"], ["with", "С сахаром"]];
const ENERGY: OptList = [["no", "Нет"], ["sometimes", "Иногда"], ["regular", "Регулярно"]];
const SWEETS: OptList = [["no", "Не ем"], ["sometimes", "Иногда"], ["daily", "Каждый день"]];
const FASTFOOD: OptList = [["no", "Не ем"], ["sometimes", "Иногда"], ["often", "Часто"]];
const NIGHT: OptList = [["no", "Нет"], ["sometimes", "Иногда"], ["often", "Часто"]];
const STRESS: OptList = [["low", "Низкий"], ["medium", "Средний"], ["high", "Высокий"]];
const SCREEN: OptList = [["lt4", "до 4 часов"], ["4to8", "4–8 часов"], ["gt8", "более 8 часов"]];

function HabitsPage() {
  const { profile, setProfile, ready, error, retry } = useProfile();
  const navigate = useNavigate();
  const [h, setH] = useState<Habits>({});

  useEffect(() => {
    if (profile?.habits) setH(profile.habits);
  }, [profile?.name]);

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Мои привычки" subtitle="Загружаем ваши данные" backTo="/profile" />
        <Card className="p-6 text-center text-sm text-muted-foreground">Загрузка профиля…</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Мои привычки" subtitle="Не удалось загрузить данные" backTo="/profile" />
        <Card className="flex flex-col gap-4 p-6 text-center">
          <p className="text-sm text-destructive">Ошибка загрузки профиля: {error}</p>
          <Button type="button" variant="outline" onClick={retry}>Повторить</Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Мои привычки" subtitle="Сначала заполните профиль" backTo="/profile" />
        <Card className="flex flex-col gap-4 p-6 text-center">
          <div>
            <p className="font-semibold">Профиль ещё не создан</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Создайте и заполните профиль, после этого можно будет сохранить привычки.
            </p>
          </div>
          <Button asChild><Link to="/profile">Перейти к профилю</Link></Button>
        </Card>
      </div>
    );
  }

  const upd = <K extends keyof Habits>(k: K, v: Habits[K]) => setH((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await setProfile({ ...profile, habits: h });
    if (result.ok) {
      toast.success("Привычки сохранены");
      navigate({ to: "/profile" });
    } else {
      toast.error(`Не удалось сохранить привычки: ${result.error}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Мои привычки" subtitle="Образ жизни и ежедневные привычки" backTo="/profile" />

      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Курение"><Sel value={h.smoking} onChange={(v) => upd("smoking", v as Habits["smoking"])} options={SMOKING} /></Field>
          <Field label="Электронные сигареты"><Sel value={h.vape} onChange={(v) => upd("vape", v as Habits["vape"])} options={VAPE} /></Field>
          <Field label="Алкоголь"><Sel value={h.alcohol} onChange={(v) => upd("alcohol", v as Habits["alcohol"])} options={ALCOHOL} /></Field>

          <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
            <p className="text-sm font-semibold">Кофе</p>
            <Field label="Сколько чашек"><Sel value={h.coffeeFreq} onChange={(v) => upd("coffeeFreq", v as Habits["coffeeFreq"])} options={COFFEE} /></Field>
            <Field label="Объём, мл">
              <Input type="number" inputMode="numeric" value={h.coffeeMl ?? ""} onChange={(e) => upd("coffeeMl", e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
            <p className="text-sm font-semibold">Чай</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Чашек">
                <Input type="number" inputMode="numeric" value={h.teaCups ?? ""} onChange={(e) => upd("teaCups", e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label="Объём, мл">
                <Input type="number" inputMode="numeric" value={h.teaMl ?? ""} onChange={(e) => upd("teaMl", e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
            </div>
            <Field label="Сахар"><Sel value={h.teaSugar} onChange={(v) => upd("teaSugar", v as Habits["teaSugar"])} options={TEA_SUGAR} /></Field>
          </div>

          <Field label="Энергетики"><Sel value={h.energyDrinks} onChange={(v) => upd("energyDrinks", v as Habits["energyDrinks"])} options={ENERGY} /></Field>
          <Field label="Сладкое"><Sel value={h.sweets} onChange={(v) => upd("sweets", v as Habits["sweets"])} options={SWEETS} /></Field>
          <Field label="Фастфуд"><Sel value={h.fastfood} onChange={(v) => upd("fastfood", v as Habits["fastfood"])} options={FASTFOOD} /></Field>
          <Field label="Ночные перекусы"><Sel value={h.nightSnacks} onChange={(v) => upd("nightSnacks", v as Habits["nightSnacks"])} options={NIGHT} /></Field>
          <Field label="Уровень стресса"><Sel value={h.stressLevel} onChange={(v) => upd("stressLevel", v as Habits["stressLevel"])} options={STRESS} /></Field>
          <Field label="Время за компьютером"><Sel value={h.screenTime} onChange={(v) => upd("screenTime", v as Habits["screenTime"])} options={SCREEN} /></Field>

          <Field label="Шагов в обычный день">
            <Input type="number" inputMode="numeric" value={h.dailySteps ?? ""} onChange={(e) => upd("dailySteps", e.target.value ? Number(e.target.value) : undefined)} />
          </Field>

          <Button type="submit" size="lg" className="h-12 font-semibold">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Sel({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: OptList }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Не указано" /></SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
