import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ChevronRight, Droplet, Moon, Smile } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useEntries, formatDateRu } from "@/lib/store";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { entries } = useEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="История" subtitle={`Записей: ${sorted.length}`} />

      {sorted.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Пока нет записей</Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((e) => (
            <li key={e.date}>
              <Link to="/history/$date" params={{ date: e.date }} className="block">
                <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{formatDateRu(e.date)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{e.weight.toFixed(1)} кг</span>
                      <span className="flex items-center gap-1"><Droplet className="h-3 w-3" />{(e.water / 1000).toFixed(1)} л</span>
                      <span className="flex items-center gap-1"><Moon className="h-3 w-3" />{e.sleep.toFixed(1)} ч</span>
                      <span className="flex items-center gap-1"><Smile className="h-3 w-3" />{e.mood}/10</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
