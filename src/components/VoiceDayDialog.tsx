import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { analyzeDayText, type AnalyzeDayTextResult, type DayTextAnalysis } from "@/lib/ai.functions";
import { Mic } from "lucide-react";

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

export function VoiceDayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const analyzeDayTextFn = useServerFn(analyzeDayText);
  const { supported, listening, toggle, abort, speechError } = useSpeechRecognition();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeDayTextResult | null>(null);

  const appendTranscript = (spoken: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
  };

  useEffect(() => {
    if (!open) abort();
  }, [open, abort]);

  const handleOpenChange = (next: boolean) => {
    if (!next) abort();
    if (next) setResult(null);
    onOpenChange(next);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Расскажите о своём дне</DialogTitle>
          <DialogDescription>
            Надиктуйте или напишите одной фразой, что было за день. AI извлечёт данные автоматически.
          </DialogDescription>
        </DialogHeader>

        {!supported && (
          <Alert>
            <AlertDescription>
              {typeof window !== "undefined" && !window.isSecureContext
                ? "Голосовой ввод работает только по HTTPS. Откройте приложение по защищённому адресу или введите текст вручную."
                : "Голосовой ввод не поддерживается в этом браузере. Введите текст вручную."}
            </AlertDescription>
          </Alert>
        )}

        {speechError && (
          <Alert variant="destructive">
            <AlertDescription>{speechError}</AlertDescription>
          </Alert>
        )}

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="min-h-[120px]"
        />

        {listening && (
          <p className="text-sm text-muted-foreground">Говорите… Нажмите «Слушаю...», чтобы остановить.</p>
        )}

        {supported && (
          <Button
            type="button"
            variant={listening ? "secondary" : "outline"}
            onClick={() => toggle(appendTranscript)}
            disabled={loading}
            className="gap-2"
          >
            <Mic className={`h-4 w-4 ${listening ? "animate-pulse text-primary" : ""}`} />
            {listening ? "Слушаю..." : "Начать говорить"}
          </Button>
        )}

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
  );
}
