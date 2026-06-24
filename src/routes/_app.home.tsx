import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Droplet, Moon, Smile, Activity, TrendingDown, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, useProfile, todayISO, formatDateRu } from "@/lib/store";

export const Route = createFileRoute("/_app/home")({
  component: HomePage,
});

function HomePage() {
  const { profile } = useProfile();
  const { entries } = useEntries();

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const last = entries[entries.length - 1];

  const weight = todayEntry?.weight ?? last?.weight ?? profile?.currentWeight ?? 0;
  const target = profile?.targetWeight ?? 0;
  const water = todayEntry?.water ?? 0;
  const waterGoal = profile?.waterGoal ?? 2000;
  const sleep = todayEntry?.sleep ?? last?.sleep ?? 0;
  const mood = todayEntry?.mood ?? last?.mood ?? 0;
  const wellbeing = todayEntry?.wellbeing ?? last?.wellbeing ?? "—";

  const weightDelta = profile ? (weight - profile.currentWeight).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Привет, ${profile?.name ?? "друг"} 👋`}
        subtitle={formatDateRu(today)}
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">Текущий вес</p>
            <p className="mt-1 text-4xl font-bold">{weight.toFixed(1)} <span className="text-xl font-medium opacity-80">кг</span></p>
            <p className="mt-2 text-xs opacity-90">
              Цель: {target.toFixed(1)} кг • {Number(weightDelta) >= 0 ? "+" : ""}{weightDelta} кг
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Droplet className="h-5 w-5" />}
          label="Вода"
          value={`${(water / 1000).toFixed(1)} л`}
          hint={`Цель: ${(waterGoal / 1000).toFixed(1)} л`}
          progress={Math.min(100, (water / waterGoal) * 100)}
          tint="bg-chart-2/15 text-chart-2"
        />
        <StatCard
          icon={<Moon className="h-5 w-5" />}
          label="Сон"
          value={`${sleep.toFixed(1)} ч`}
          hint="Норма: 7–9 ч"
          progress={Math.min(100, (sleep / 8) * 100)}
          tint="bg-chart-5/15 text-chart-5"
        />
        <StatCard
          icon={<Smile className="h-5 w-5" />}
          label="Настроение"
          value={`${mood}/10`}
          hint={mood >= 7 ? "Отличное" : mood >= 4 ? "Хорошее" : "Так себе"}
          progress={mood * 10}
          tint="bg-chart-3/15 text-chart-3"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Самочувствие"
          value={wellbeing.length > 14 ? wellbeing.slice(0, 14) + "…" : wellbeing}
          hint="Краткая отметка"
          tint="bg-chart-4/15 text-chart-4"
        />
      </div>

      <Button asChild size="lg" className="mt-2 h-14 text-base font-semibold">
        <Link to="/diary">
          <Plus className="mr-1 h-5 w-5" />
          {todayEntry ? "Обновить сегодня" : "Заполнить день"}
        </Link>
      </Button>
    </div>
  );
}

function StatCard({
  icon, label, value, hint, progress, tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  progress?: number;
  tint: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tint}`}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      {progress !== undefined && <Progress value={progress} className="h-1.5" />}
    </Card>
  );
}
