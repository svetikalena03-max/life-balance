import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Clock3, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useProfile } from "@/lib/store";
import { getWorkoutMinutes, WORKOUTS } from "@/lib/workout-data";

export const Route = createFileRoute("/_app/workouts")({
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const detailMatch = useMatch({ from: "/_app/workouts/$id", shouldThrow: false });
  const { profile, ready, error } = useProfile();
  const pregnancy = profile?.healthFeatures?.women?.includes("pregnancy") ?? false;
  const thrombosis = profile?.healthFeatures?.chronic?.includes("thrombosis") ?? false;
  const limits = profile?.healthFeatures?.training ?? [];
  const needsDoctorPlan = limits.some((value) => ["walkonly", "lfk"].includes(value));
  const needsGentle = limits.some((value) =>
    ["soft", "nostand", "nostrength", "nojump", "norun"].includes(value),
  );

  if (!ready || error)
    return (
      <Card className="p-5">
        {error
          ? "Не удалось проверить ограничения здоровья. Попробуйте позже."
          : "Загружаем ограничения здоровья…"}
      </Card>
    );

  if (pregnancy || thrombosis || needsDoctorPlan)
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Тренировки" backTo="/home" />
        <Card className="border-amber-500/35 bg-amber-500/10 p-5">
          <p className="font-semibold">Готовые комплексы сейчас не показываются</p>
          <p className="mt-2 text-sm text-muted-foreground">
            В профиле отмечена беременность, тромб или ограничение «только ходьба / ЛФК». Приложение
            не может определить, какие упражнения вам подходят. Согласуйте активность с лечащим
            врачом.
          </p>
        </Card>
      </div>
    );

  if (detailMatch) return <Outlet />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="🏃 Тренировки"
        subtitle="Выберите темп, а приложение покажет каждое движение и отсчитает время."
        backTo="/home"
        backLabel="На главную"
      />

      {(needsDoctorPlan || needsGentle) && (
        <Card className="border-amber-500/35 bg-amber-500/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-foreground">
                {needsDoctorPlan
                  ? "В профиле указано: только ходьба или ЛФК"
                  : "Учтём ваши ограничения"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {needsDoctorPlan
                  ? "Готовые комплексы не заменяют назначенную ЛФК. Выполняйте только упражнения, которые разрешил специалист."
                  : "Начните с мягкого комплекса. Пропускайте любое движение, которое вызывает боль."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {WORKOUTS.map((workout) => {
          const recommended = (needsDoctorPlan || needsGentle) && workout.id === "gentle-morning";
          return (
            <Link key={workout.id} to="/workouts/$id" params={{ id: workout.id }}>
              <Card
                className={`h-full overflow-hidden border-primary/15 bg-gradient-to-br ${workout.accent} p-5 transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card/80 text-3xl shadow-sm">
                    {workout.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-foreground">{workout.title}</h2>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {workout.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-1 text-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {getWorkoutMinutes(workout)} мин
                      </span>
                      <span className="rounded-full bg-card/80 px-2 py-1 text-foreground">
                        {workout.level}
                      </span>
                      {recommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" /> Подходит лучше
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="p-4 text-sm leading-relaxed text-muted-foreground">
        Остановитесь при боли в груди, выраженной одышке, головокружении или резком ухудшении
        самочувствия. Не тренируйтесь через боль и не заменяйте приложением назначения врача.
      </Card>
    </div>
  );
}
