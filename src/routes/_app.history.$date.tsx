import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, formatDateRu } from "@/lib/store";

export const Route = createFileRoute("/_app/history/$date")({
  component: HistoryDetail,
});

function HistoryDetail() {
  const { date } = Route.useParams();
  const { entries } = useEntries();
  const entry = entries.find((e) => e.date === date);

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/history"><ArrowLeft className="mr-1 h-4 w-4" />История</Link>
      </Button>

      <PageHeader title={formatDateRu(date)} subtitle="Подробности дня" />

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
            {entry.systolic != null && <Metric label="Давление" value={`${entry.systolic}/${entry.diastolic ?? "—"}`} />}
            {entry.pulse != null && <Metric label="Пульс" value={`${entry.pulse} уд/мин`} />}
            {entry.energy != null && <Metric label="Энергия" value={`${entry.energy}/10`} />}
            {entry.stress != null && <Metric label="Стресс" value={`${entry.stress}/10`} />}
          </div>

          {(entry.edema || entry.heartburn || entry.bloating || entry.backPain || entry.kneePain) && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Симптомы</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {entry.edema && <Tag>Отёки</Tag>}
                {entry.heartburn && <Tag>Изжога</Tag>}
                {entry.bloating && <Tag>Вздутие</Tag>}
                {entry.backPain && <Tag>Боль в спине</Tag>}
                {entry.kneePain && <Tag>Боль в коленях</Tag>}
              </div>
            </Card>
          )}

          {entry.food && <Section title="Питание" body={entry.food} />}
          {entry.drinks && <Section title="Напитки" body={entry.drinks} />}
          {entry.wellbeing && <Section title="Самочувствие" body={entry.wellbeing} />}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{body}</p>
    </Card>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{children}</span>;
}
