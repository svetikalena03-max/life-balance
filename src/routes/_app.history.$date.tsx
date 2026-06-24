import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, formatDateRu, MEAL_LABELS, SUGAR_LABELS } from "@/lib/store";

export const Route = createFileRoute("/_app/history/$date")({
  component: HistoryDetail,
});

function HistoryDetail() {
  const { date } = Route.useParams();
  const { entries } = useEntries();
  const entry = entries.find((e) => e.date === date);

  const symptoms: Array<[boolean | undefined, string]> = entry ? [
    [entry.edema, "Отёки"],
    [entry.heartburn, "Изжога"],
    [entry.bloating, "Вздутие"],
    [entry.backPain, "Боль в спине"],
    [entry.kneePain, "Боль в коленях"],
    [entry.stressed, "Стресс"],
  ] : [];
  const hasSymptoms = symptoms.some(([v]) => v);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={formatDateRu(date)} subtitle="Подробности дня" backTo="/history" backLabel="История" />

      {!entry ? (
        <Card className="p-6 text-center text-muted-foreground">Запись не найдена</Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {entry.weight != null && <Metric label="Вес" value={`${entry.weight.toFixed(1)} кг`} />}
            {entry.water != null && <Metric label="Вода" value={`${(entry.water / 1000).toFixed(1)} л`} />}
            {entry.sleep != null && <Metric label="Сон" value={`${entry.sleep.toFixed(1)} ч`} />}
            {entry.mood != null && <Metric label="Настроение" value={`${entry.mood}/10`} />}
            {entry.breadUnits != null && <Metric label="Хлебцы" value={`${entry.breadUnits} шт`} />}
            {entry.steps != null && <Metric label="Шаги" value={`${entry.steps}`} />}
            {entry.workoutMinutes != null && <Metric label="Тренировка" value={`${entry.workoutMinutes} мин`} />}
            {entry.systolic != null && <Metric label="Давление" value={`${entry.systolic}/${entry.diastolic ?? "—"}`} />}
            {entry.pulse != null && <Metric label="Пульс" value={`${entry.pulse} уд/мин`} />}
            {entry.energy != null && <Metric label="Энергия" value={`${entry.energy}/10`} />}
          </div>

          {hasSymptoms && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Симптомы</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {symptoms.filter(([v]) => v).map(([, label]) => <Tag key={label}>{label}</Tag>)}
              </div>
            </Card>
          )}

          {entry.workout && <Section title="Тренировка" body={entry.workout} />}
          {entry.food && <Section title="Питание" body={entry.food} />}
          {entry.drinks && <Section title="Напитки" body={entry.drinks} />}
          {entry.wellbeing && <Section title="Самочувствие" body={entry.wellbeing} />}
          {entry.healthComment && <Section title="Комментарий к здоровью" body={entry.healthComment} />}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{body}</p>
    </Card>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{children}</span>;
}
