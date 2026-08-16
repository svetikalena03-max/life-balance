import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Target, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeDaySummary, type AnalyzeDaySummaryResult } from "@/lib/day-summary.functions";

export function DayAiAnalysisCard({ date }: { date: string }) {
  const analyzeDaySummaryFn = useServerFn(analyzeDaySummary);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeDaySummaryResult | null>(null);

  useEffect(() => {
    setResult(null);
    setLoading(false);
  }, [date]);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      setResult(await analyzeDaySummaryFn({ data: { date } }));
    } catch (error) {
      console.error("AI day summary request failed:", error);
      setResult({
        ok: false,
        error: "Не удалось запустить AI-анализ. Проверьте подключение и попробуйте ещё раз.",
      });
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.ok ? result.analysis : null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">AI-анализ дня</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {analysis
                ? analysis.summary
                : "Анализ формируется по сохранённым данным выбранного дня и вашему профилю."}
            </p>
          </div>
          {analysis && (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-primary/20 bg-background">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{analysis.score.value}</p>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">из 100</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4">
        {result && !result.ok && (
          <Alert variant="destructive">
            <AlertTitle>AI-анализ недоступен</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <>
            <CoachSection
              icon={CheckCircle2}
              title="Что получилось хорошо"
              items={analysis.positives}
            />
            <CoachSection
              icon={AlertTriangle}
              title="На что обратить внимание"
              items={analysis.attention}
            />
            <CoachSection
              icon={Target}
              title="Что сделать завтра"
              items={analysis.tomorrow}
              ordered
            />

            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Итоговая оценка дня</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{analysis.score.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {analysis.score.explanation}
              </p>
            </div>
          </>
        )}

        <Button type="button" onClick={runAnalysis} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Формируем анализ…
            </>
          ) : analysis ? (
            "Обновить анализ"
          ) : result ? (
            "Повторить"
          ) : (
            "Сформировать AI-анализ"
          )}
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          AI-анализ носит информационный характер и не заменяет консультацию врача.
        </p>
      </div>
    </Card>
  );
}

function CoachSection({
  icon: Icon,
  title,
  items,
  ordered = false,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <section className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ListTag
        className={`mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground ${ordered ? "list-decimal pl-5" : "list-disc pl-5"}`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}
