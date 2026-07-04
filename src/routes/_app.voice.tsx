import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { VoiceDayDialog } from "@/components/VoiceDayDialog";
import { ArrowLeft, Mic } from "lucide-react";

export const Route = createFileRoute("/_app/voice")({
  component: VoicePage,
});

function VoicePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Голосовой помощник</h1>

      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex cursor-pointer flex-col items-center gap-3 p-6 text-center transition-colors hover:bg-accent"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Mic className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-foreground">Рассказать о своём дне</p>
        <p className="text-sm text-muted-foreground">
          Опишите свой день словами — AI разложит запись по питанию, воде, сну и самочувствию.
        </p>
      </Card>

      <VoiceDayDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
