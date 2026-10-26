import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_app/examinations")({ component: ExaminationsPage });
function ExaminationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Анализы и обследования" subtitle="Выберите, что хотите понять" />
      <Link to="/labs">
        <Card className="p-5 hover:bg-accent/30">
          <h2 className="font-semibold text-primary">Анализы крови и другие →</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Показатели, результаты, единицы и нормы на бланке.
          </p>
        </Card>
      </Link>
      <Link to="/examination-report">
        <Card className="p-5 hover:bg-accent/30">
          <h2 className="font-semibold text-primary">Заключение УЗИ, КТ, МРТ →</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Объяснение письменного заключения врача, включая рентген. Загрузите текст заключения, не
            снимки.
          </p>
        </Card>
      </Link>
      <p className="text-sm text-muted-foreground">
        Справочная информация: приложение не ставит диагноз и не назначает лечение.
      </p>
    </div>
  );
}
