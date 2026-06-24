import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crown } from "lucide-react";

export const Route = createFileRoute("/_app/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Подписка</h1>
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Crown className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-foreground">Платная версия скоро</p>
        <p className="text-sm text-muted-foreground">
          Расширенная аналитика, неограниченные записи и приоритетная поддержка появятся позже.
        </p>
      </Card>
    </div>
  );
}
