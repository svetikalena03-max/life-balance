import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SaveSuccess({
  title = "Запись сохранена",
  description = "Данные обновлены и появились на главной, в истории и графиках.",
  onContinue,
}: {
  title?: string;
  description?: string;
  onContinue: () => void;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        <Button asChild size="lg" className="h-12 w-full font-semibold">
          <Link to="/home">
            <Home className="mr-1 h-5 w-5" /> На главную
          </Link>
        </Button>
        <Button onClick={onContinue} variant="secondary" size="lg" className="h-12 w-full font-semibold">
          <RotateCcw className="mr-1 h-5 w-5" /> Продолжить заполнение
        </Button>
      </div>
    </Card>
  );
}
