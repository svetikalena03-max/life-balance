import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Droplet,
  Moon,
  Smile,
  Activity,
  TrendingDown,
  Plus,
  Heart,
  HeartPulse,
  Mic,
  GlassWater,
  ChefHat,
  Dumbbell,
  ChevronRight,
} from "lucide-react";
import { useEntries, useProfile, todayISO, formatDateWeekday } from "@/lib/store";
import { VoiceDayDialog } from "@/components/VoiceDayDialog";

export const Route = createFileRoute("/_app/home")({
  component: HomePage,
});

function HomePage() {
  const { profile } = useProfile();
  const { entries } = useEntries();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const lastWith = <K extends keyof (typeof entries)[number]>(key: K) =>
    [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .find((e) => e[key] !== undefined && e[key] !== null);

  const weightEntry = todayEntry?.weight != null ? todayEntry : lastWith("weight");
  const weight = weightEntry?.weight ?? profile?.currentWeight;
  const target = profile?.targetWeight ?? 0;
  const water = todayEntry?.water;
  const waterGoal = profile?.waterGoal ?? 2000;
  const sleepEntry = todayEntry?.sleep != null ? todayEntry : lastWith("sleep");
  const moodEntry = todayEntry?.mood != null ? todayEntry : lastWith("mood");
  const wellEntry = todayEntry?.wellbeing ? todayEntry : lastWith("wellbeing");
  const sleep = sleepEntry?.sleep;
  const mood = moodEntry?.mood;
  const wellbeing = wellEntry?.wellbeing;
  const recorded = (date?: string) =>
    date === today
      ? "Сегодня"
      : date
        ? `Запись: ${date.split("-").reverse().join(".")}`
        : "Пока не заполнено";
  const hasDrinks = [todayEntry?.tea, todayEntry?.coffee, todayEntry?.soda, todayEntry?.juice].some(
    (value) => value != null,
  );

  const otherDrinks =
    (todayEntry?.tea ?? 0) +
    (todayEntry?.coffee ?? 0) +
    (todayEntry?.soda ?? 0) +
    (todayEntry?.juice ?? 0);

  const lastBP = todayEntry?.systolic ? todayEntry : lastWith("systolic");

  return (
    <div className="flex flex-col gap-4">
      <header className="pt-2 pb-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatDateWeekday(today)}
        </p>
        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">
          Привет, {profile?.name ?? "друг"} 👋
        </h1>
      </header>

      <Button
        onClick={() => setVoiceOpen(true)}
        size="lg"
        className="h-16 w-full justify-start gap-3 rounded-2xl bg-gradient-to-r from-chart-5/80 to-primary/80 px-5 text-base font-semibold text-primary-foreground shadow-md hover:opacity-95"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/25">
          <Mic className="h-5 w-5" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate">Рассказать о своём дне</span>
          <span className="block text-xs font-normal opacity-90">
            Голосом или текстом — заполним дневник
          </span>
        </span>
      </Button>

      <VoiceDayDialog open={voiceOpen} onOpenChange={setVoiceOpen} />

      <Link
        to="/diary"
        hash="w"
        hashScrollIntoView={{ block: "center" }}
        aria-label="Заполнить вес за сегодня"
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground shadow-lg transition-opacity hover:opacity-90">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm opacity-90">Текущий вес</p>
              <p className="mt-1 text-4xl font-bold">
                {weight != null ? Number(weight).toFixed(1) : "—"}{" "}
                <span className="text-xl font-medium opacity-80">кг</span>
              </p>
              <p className="mt-2 text-xs opacity-90">
                {weightEntry
                  ? recorded(weightEntry.date)
                  : weight != null
                    ? "Из профиля"
                    : "Пока не заполнено"}
                {target > 0 ? ` • Цель: ${Number(target).toFixed(1)} кг` : ""}
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs font-medium">Заполнить вес →</p>
        </Card>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Droplet className="h-5 w-5" />}
          label="Вода"
          to="/diary"
          hash="water"
          value={water != null ? `${(water / 1000).toFixed(1)} л` : "—"}
          hint={water != null ? `Цель: ${(waterGoal / 1000).toFixed(1)} л` : "Пока не заполнено"}
          progress={
            water != null && waterGoal > 0 ? Math.min(100, (water / waterGoal) * 100) : undefined
          }
          tint="bg-chart-2/15 text-chart-2"
        />
        <StatCard
          icon={<GlassWater className="h-5 w-5" />}
          label="Другие напитки"
          to="/diary"
          hash="tea"
          value={hasDrinks ? `${(otherDrinks / 1000).toFixed(1)} л` : "—"}
          hint={hasDrinks ? "Сегодня: чай, кофе, сок" : "Пока не заполнено"}
          tint="bg-chart-4/15 text-chart-4"
        />
        <StatCard
          icon={<Moon className="h-5 w-5" />}
          label="Сон"
          to="/diary"
          hash="sl"
          value={sleep != null ? `${Number(sleep).toFixed(1)} ч` : "—"}
          hint={recorded(sleepEntry?.date)}
          progress={sleep != null ? Math.min(100, (Number(sleep) / 8) * 100) : undefined}
          tint="bg-chart-5/15 text-chart-5"
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Давление"
          to="/health"
          hash="sys"
          value={lastBP?.systolic ? `${lastBP.systolic}/${lastBP.diastolic ?? "—"}` : "—"}
          hint={recorded(lastBP?.date)}
          tint="bg-chart-1/15 text-chart-1"
        />
        <StatCard
          icon={<Smile className="h-5 w-5" />}
          label="Настроение"
          to="/diary"
          hash="mood"
          value={mood != null ? `${mood}/10` : "—"}
          hint={recorded(moodEntry?.date)}
          progress={mood != null ? mood * 10 : undefined}
          tint="bg-chart-3/15 text-chart-3"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Самочувствие"
          to="/diary"
          hash="well"
          value={
            wellbeing && wellbeing.length > 14 ? wellbeing.slice(0, 14) + "…" : wellbeing || "—"
          }
          hint={recorded(wellEntry?.date)}
          tint="bg-chart-4/15 text-chart-4"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-14 text-sm font-semibold">
          <Link to="/diary">
            <Plus className="mr-1 h-5 w-5" />
            Дневник
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-14 text-sm font-semibold">
          <Link to="/health">
            <HeartPulse className="mr-1 h-5 w-5" />
            Здоровье
          </Link>
        </Button>
      </div>
      <h2 className="mt-3 text-lg font-semibold">Полезные инструменты</h2>
      <Link to="/recovery" className="block">
        <Card className="flex items-center gap-3 border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="text-2xl">🌿</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Восстановление</p>
            <p className="text-xs text-muted-foreground">Расслабление, дыхание, медитация</p>
          </div>
        </Card>
      </Link>

      <Link to="/workouts" className="block">
        <Card className="flex items-center gap-3 border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-orange-500/10 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
            <Dumbbell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Тренировки</p>
            <p className="text-xs text-muted-foreground">
              Анимация движений, таймер и голосовые подсказки
            </p>
          </div>
        </Card>
      </Link>

      <Link to="/recipes" className="block">
        <Card className="flex items-center gap-3 border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <ChefHat className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Рецепты</p>
            <p className="text-xs text-muted-foreground">Поиск по цели, здоровью и ингредиентам</p>
          </div>
        </Card>
      </Link>

      <Link
        to="/labs"
        className="block rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
      >
        <p className="font-semibold text-primary">Разбор анализов →</p>
        <p className="mt-1 text-xs text-muted-foreground">Загрузите бланк или введите показатели</p>
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  progress,
  tint,
  to,
  hash,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
  progress?: number;
  tint: string;
  to: "/diary" | "/health";
  hash: string;
}) {
  return (
    <Link
      to={to}
      hash={hash}
      hashScrollIntoView={{ block: "center" }}
      aria-label={`Заполнить: ${label}`}
      className="block min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="flex h-full min-w-0 flex-col gap-2 border-primary/20 p-3 shadow-sm transition-all hover:border-primary hover:bg-accent/30 active:scale-[0.98] active:bg-accent/50">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tint}`}>
            {icon}
          </div>
          <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-1.5" />}
        <span className="mt-auto flex items-center justify-between rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-semibold text-primary">
          Заполнить
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
