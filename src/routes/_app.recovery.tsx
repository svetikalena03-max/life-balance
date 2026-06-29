import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/lib/settings";
import { RECOVERY_ITEMS, RECOVERY_MOODS } from "@/lib/recovery-data";

export const Route = createFileRoute("/_app/recovery")({
  component: RecoveryPage,
});

function RecoveryPage() {
  const { lang } = useSettings();
  const ru = lang === "ru";

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={ru ? "🌿 Восстановление" : "🌿 Recovery"}
        subtitle={
          ru
            ? "Расслабьтесь, снимите напряжение и восстановите силы."
            : "Relax, release tension and restore your energy."
        }
      />

      <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-emerald-500/20 p-5">
        <h2 className="text-lg font-semibold text-foreground">
          ✨ {ru ? "Как вы себя чувствуете сейчас?" : "How do you feel right now?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ru ? "Выберите, что вам нужно сегодня" : "Choose what you need today"}
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RECOVERY_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card hover:scale-[1.01]"
            >
              <span className="text-xl">{m.icon}</span>
              <span>{ru ? m.ru : m.en}</span>
            </button>
          ))}
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          {ru ? "Рекомендации" : "Recommendations"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RECOVERY_ITEMS.map((item) => (
            <Link
              key={item.id}
              to="/recovery/$id"
              params={{ id: item.id }}
              className="group"
            >
              <Card className="h-full p-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 bg-gradient-to-br from-card to-card/60">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {ru ? item.titleRu : item.titleEn}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.duration} {ru ? "мин" : "min"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
