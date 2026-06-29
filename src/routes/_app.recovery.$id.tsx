import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/lib/settings";
import { findRecoveryItem } from "@/lib/recovery-data";
import { Play } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/recovery/$id")({
  component: RecoveryDetailPage,
});

function RecoveryDetailPage() {
  const { id } = Route.useParams();
  const { lang } = useSettings();
  const ru = lang === "ru";
  const item = findRecoveryItem(id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!item) navigate({ to: "/recovery" });
  }, [item, navigate]);

  if (!item) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={ru ? item.titleRu : item.titleEn}
        backTo="/recovery"
        backLabel={ru ? "Назад" : "Back"}
      />

      <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 p-8 text-center">
        <div className="text-6xl">{item.icon}</div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {ru ? item.titleRu : item.titleEn}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.duration} {ru ? "минут" : "minutes"}
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {ru ? "Описание" : "Description"}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-foreground">
          {ru ? item.descRu : item.descEn}
        </p>
      </Card>

      <Button
        size="lg"
        disabled
        className="w-full h-14 text-base bg-gradient-to-r from-emerald-500 to-teal-500 text-white opacity-90"
      >
        <Play className="mr-2 h-5 w-5" />
        {ru ? "Скоро будет доступно" : "Coming soon"}
      </Button>
    </div>
  );
}
