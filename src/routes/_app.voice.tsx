import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { analyzeDayText, type AnalyzeDayTextResult, type DayTextAnalysis } from "@/lib/ai.functions";
import { ArrowLeft, Mic } from "lucide-react";

const PLACEHOLDER =
  "Например: Сегодня на завтрак была овсянка с бананом, выпила 2 кружки чая, воды 1 литр, давление 125 на 80, настроение 7 из 10, сон 6 часов.";

const RESULT_FIELDS: Array<{ key: keyof DayTextAnalysis; label: string }> = [
  { key: "nutrition", label: "Питание" },
  { key: "water", label: "Вода" },
  { key: "otherDrinks", label: "Другие напитки" },
  { key: "sleep", label: "Сон" },
  { key: "pressure", label: "Давление" },
  { key: "mood", label: "Настроение" },
  { key: "wellbeing", label: "Самочувствие" },
];

export const Route = createFileRoute("/_app/voice")({
  component: VoicePage,
});

function VoicePage() {
  const analyzeDayTextFn = useServerFn(analyzeDayText);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeDayTextResult | null>(null);

  const openDialog = () => {
    setResult(null);
    setOpen(true);
  };

  const runAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeDayTextFn({ data: { dayText: text.trim() } });
      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось выполнить AI-анализ",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Голосовой помощник</h1>

      <Card
        role="button"
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDialog();
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Расскажите о своём дне</DialogTitle>
            <DialogDescription>
              Напишите одной фразой, что было за день. AI извлечёт данные автоматически.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            className="min-h-[120px]"
          />

          <Button type="button" onClick={runAnalyze} disabled={loading || !text.trim()}>
            {loading ? "Анализ..." : "Проанализировать"}
          </Button>

          {result && !result.ok && (
            <Alert variant="destructive">
              <AlertTitle>AI недоступен</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {result?.ok && (
            <div className="flex flex-col gap-3">
              <dl className="grid gap-2">
                {RESULT_FIELDS.map(({ key, label }) => (
                  <div key={key} className="rounded-lg border border-border p-3">
                    <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
                    <dd className="text-sm text-foreground">{result.analysis[key]}</dd>
                  </div>
                ))}
              </dl>
              <Alert>
                <AlertTitle>Совет</AlertTitle>
                <AlertDescription>{result.analysis.advice}</AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
