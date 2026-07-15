import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { analyzeDayText, type AnalyzeDayTextResult, type DayTextAnalysis } from "@/lib/ai.functions";
import {
  hasStructuredContent,
  mergeStructuredIntoDayEntry,
  todayISO,
  useEntries,
} from "@/lib/store";
import { Mic } from "lucide-react";
import { toast } from "sonner";

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

export function VoiceDayContent({
  className,
  suggestedPhrase,
  onActiveChange,
}: {
  className?: string;
  /** Фраза-подсказка с родительской страницы — подставляется в поле ввода. */
  suggestedPhrase?: { id: number; text: string } | null;
  onActiveChange?: (active: boolean) => void;
}) {
  const analyzeDayTextFn = useServerFn(analyzeDayText);
  const { entries, saveEntry, ready: entriesReady, error: entriesError } = useEntries();
  const {
    supported,
    unsupportedReason,
    listening,
    finalText,
    interimText,
    start,
    stop,
    abort,
    speechError,
  } = useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<AnalyzeDayTextResult | null>(null);

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);

  useEffect(() => {
    onActiveChange?.(listening || loading || saving);
  }, [listening, loading, saving, onActiveChange]);

  useEffect(() => {
    if (!suggestedPhrase) return;
    setText((prev) => (prev.trim() ? `${prev.trim()} ${suggestedPhrase.text}` : suggestedPhrase.text));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.scrollTop = el.scrollHeight;
    });
  }, [suggestedPhrase?.id]);

  useEffect(() => {
    if (!listening) return;
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [listening, finalText, interimText]);

  const appendTranscript = (spoken: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.scrollTop = el.scrollHeight;
    });
  };

  const handleVoiceToggle = () => {
    if (listening) {
      stop();
      return;
    }
    start(appendTranscript);
  };

  useEffect(() => () => abort(), [abort]);

  const runAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setSaved(false);

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

  const runSave = async () => {
    if (!result?.ok) return;

    if (!entriesReady) {
      toast.error("Дневник ещё загружается. Подождите немного и попробуйте сохранить снова.");
      return;
    }

    if (entriesError) {
      toast.error(
        "Не удалось загрузить текущий дневник. Сохранение остановлено, чтобы не потерять уже записанные данные.",
      );
      return;
    }

    if (!hasStructuredContent(result.structured)) {
      toast.error("AI не извлёк данные для сохранения. Уточните описание дня и попробуйте снова.");
      return;
    }

    setSaving(true);
    try {
      const merged = mergeStructuredIntoDayEntry(todayEntry, result.structured, today);
      const saveResult = await saveEntry(merged);
      if (!saveResult.ok) {
        toast.error(saveResult.error);
        return;
      }
      setSaved(true);
      toast.success("Данные сохранены");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить данные");
    } finally {
      setSaving(false);
    }
  };

  const diaryReadyForSave = entriesReady && !entriesError;
  const canSave = result?.ok && hasStructuredContent(result.structured) && diaryReadyForSave;

  return (
    <div className={className}>
      {!supported && (
        <Alert className="mb-4">
          <AlertDescription>
            {unsupportedReason === "https"
              ? "Голосовой ввод работает только по HTTPS. Откройте приложение по защищённому адресу или введите текст вручную."
              : "Голосовой ввод недоступен: браузер не поддерживает Web Speech API. Используйте Chrome или Edge на компьютере/Android, либо введите текст вручную."}
          </AlertDescription>
        </Alert>
      )}

      {speechError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{speechError}</AlertDescription>
        </Alert>
      )}

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        className="min-h-[140px] text-base"
      />

      {listening && (
        <div
          ref={previewRef}
          className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">Сейчас распознаётся</p>
          <p className="mt-1 whitespace-pre-wrap">
            {finalText || interimText ? (
              <>
                {finalText}
                {interimText && (
                  <span className="text-muted-foreground">{finalText ? ` ${interimText}` : interimText}</span>
                )}
              </>
            ) : (
              "Говорите…"
            )}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {supported && (
          <Button
            type="button"
            variant={listening ? "secondary" : "outline"}
            onClick={handleVoiceToggle}
            disabled={loading || saving}
            className="gap-2"
          >
            <Mic className={`h-4 w-4 ${listening ? "animate-pulse text-primary" : ""}`} />
            {listening ? "Остановить" : "Начать говорить"}
          </Button>
        )}

        {listening && (
          <p className="text-sm text-muted-foreground">
            Можно говорить несколько фраз подряд. Нажмите «Остановить», когда закончите — текст появится в поле выше.
          </p>
        )}

        <Button type="button" onClick={runAnalyze} disabled={loading || saving || !text.trim()} size="lg">
          {loading ? "Анализ..." : "Проанализировать день"}
        </Button>
      </div>

      {result && !result.ok && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>AI недоступен</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {result?.ok && (
        <div className="mt-4 flex flex-col gap-3">
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
          <Button type="button" onClick={runSave} disabled={saving || saved || !canSave} size="lg">
            {saving
              ? "Сохранение..."
              : saved
                ? "Сохранено"
                : !entriesReady
                  ? "Дневник загружается..."
                  : "Сохранить в дневник"}
          </Button>
          {result.ok && entriesError && (
            <p className="text-sm text-destructive">
              Не удалось загрузить текущий дневник. Сохранение временно недоступно, чтобы не перезаписать уже
              сохранённые данные.
            </p>
          )}
          {result.ok && !entriesError && !entriesReady && (
            <p className="text-sm text-muted-foreground">
              Дождитесь загрузки дневника перед сохранением результата AI.
            </p>
          )}
          {result.ok && diaryReadyForSave && !canSave && (
            <p className="text-sm text-muted-foreground">
              AI не нашёл структурированных данных для сохранения. Дополните описание дня.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
