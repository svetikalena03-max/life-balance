import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { explainExamination, recognizeExamination } from "@/lib/examination.functions";
import { examinationReportText, type ExaminationResult } from "@/lib/examination";
import { prepareLabFile } from "@/lib/lab-file";

export const Route = createFileRoute("/_app/examination-report")({ component: ExaminationPage });
function ExaminationPage() {
  const recognize = useServerFn(recognizeExamination);
  const explain = useServerFn(explainExamination);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ExaminationResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useBlocker({
    shouldBlockFn: () =>
      Boolean(text.trim() || context.trim() || busy || result) &&
      !window.confirm(
        "Заключение и объяснение не сохраняются в истории. Уйти и потерять введённое?",
      ),
    enableBeforeUnload: Boolean(text.trim() || context.trim() || busy || result),
  });
  const invalidate = () => {
    setReviewed(false);
    setResult(null);
    setError("");
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !consent || busy) return;
    invalidate();
    setProgress("");
    setBusy("Подготавливаем файл…");
    let combined = text;
    let completed = 0;
    let total = 1;
    try {
      let files = [file];
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        if (file.size > 10 * 1024 * 1024) throw new Error("PDF должен быть до 10 МБ.");
        const { splitLabPdf } = await import("@/lib/lab-pages");
        const pages = await splitLabPdf(new Uint8Array(await file.arrayBuffer()));
        files = pages.map(
          (bytes, index) =>
            new File([bytes as BlobPart], `page-${index + 1}.pdf`, { type: "application/pdf" }),
        );
      }
      total = files.length;
      for (let index = 0; index < total; index++) {
        setBusy(`Читаем страницу ${index + 1} из ${total}…`);
        const prepared = await prepareLabFile(files[index]);
        const response = await recognize({ data: { ...prepared, consent: true } });
        if (!response.ok) throw new Error(response.error);
        const next = [combined.trim(), response.text.trim()].filter(Boolean).join("\n\n");
        if (next.length > 32000)
          throw new Error(
            "Заключение слишком длинное для одного разбора (до 32 000 знаков). Разберите оставшиеся страницы отдельно.",
          );
        combined = next;
        setText(combined);
        completed++;
        setProgress(
          `Добавлено страниц: ${completed} из ${total}. Сверьте весь текст с заключением.`,
        );
      }
    } catch (e) {
      setError(
        `Добавлено страниц: ${completed} из ${total}. ${e instanceof Error ? e.message : "Не удалось прочитать файл."} Уже прочитанный текст остался в форме. Повторно загружайте только непрочитанные страницы.`,
      );
    } finally {
      setBusy("");
    }
  };
  const analyze = async () => {
    setBusy("Объясняем заключение…");
    setError("");
    setResult(null);
    try {
      const response = await explain({ data: { text, context, consent, reviewed } });
      if (!response.ok) throw new Error(response.error);
      setResult(response.result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось получить объяснение. Текст остался в форме.",
      );
    } finally {
      setBusy("");
    }
  };
  const download = async () => {
    if (!result) return;
    setBusy("Готовим PDF…");
    setError("");
    try {
      const { createTextPdf } = await import("@/lib/lab-pdf");
      createTextPdf(examinationReportText(result), "Баланс жизни - заключение обследования").save(
        "balans-zhizni-obsledovanie.pdf",
      );
    } catch {
      setError("Не удалось скачать PDF. Объяснение осталось на экране.");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Заключение обследования"
        subtitle="УЗИ, КТ, МРТ и рентген — простыми словами"
        backTo="/examinations"
        backLabel="Анализы и обследования"
      />
      <Card className="space-y-3 p-4 text-sm">
        <p>
          Загрузите письменное заключение врача, не снимки. Объясним термины и поможем подготовить
          вопросы врачу. Приложение не ставит диагноз, не оценивает снимки и не назначает лечение.
        </p>
        <p className="text-muted-foreground">
          Уберите ФИО и другие личные данные. Документ и объяснение не сохраняются в истории: перед
          уходом скачайте PDF.
        </p>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consent}
            disabled={!!busy}
            onChange={(e) => {
              setConsent(e.target.checked);
              invalidate();
            }}
          />
          <span>
            Разрешаю отправить выбранное заключение и контекст в Яндекс для распознавания и
            объяснения.
          </span>
        </label>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">1. Добавьте и проверьте текст</h2>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={upload}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!consent || !!busy}
          onClick={() => input.current?.click()}
        >
          Загрузить фото или PDF заключения
        </Button>
        <p className="text-xs text-muted-foreground">
          PDF до 10 страниц и 10 МБ, каждая страница до 2 МБ. Новые файлы добавляют текст. Не
          загружайте один документ дважды.
        </p>
        {progress && (
          <p role="status" className="text-sm">
            {progress}
          </p>
        )}
        <Label htmlFor="exam-text">Текст заключения — можно вставить вручную</Label>
        <Textarea
          id="exam-text"
          rows={12}
          maxLength={32000}
          disabled={!!busy}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            invalidate();
          }}
        />
        <Label htmlFor="exam-context">Контекст — по желанию, без ФИО</Label>
        <Textarea
          id="exam-context"
          rows={3}
          maxLength={1500}
          disabled={!!busy}
          placeholder="Возраст, жалобы, причина обследования"
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            invalidate();
          }}
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={reviewed}
            disabled={!!busy}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          <span>
            Я сверила(сверил) весь текст с заключением, включая отрицания, размеры и стороны.
          </span>
        </label>
        <Button
          className="w-full"
          disabled={!consent || !reviewed || text.trim().length < 20 || !!busy}
          onClick={() => void analyze()}
        >
          Объяснить заключение
        </Button>
      </Card>
      {busy && <p role="status">{busy}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <section className="space-y-3" aria-live="polite">
          <h2 className="text-lg font-semibold">Объяснение заключения</h2>
          <Button variant="outline" disabled={!!busy} onClick={() => void download()}>
            Скачать объяснение (PDF)
          </Button>
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Простыми словами</h3>
            <p className="whitespace-pre-wrap text-sm">{result.summary}</p>
          </Card>
          {result.terms.map((item, index) => (
            <Card className="p-4" key={index}>
              <h3 className="font-semibold">{item.term}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.explanation}</p>
            </Card>
          ))}
          <Card className="space-y-3 p-4">
            <h3 className="font-semibold">Что обсудить с врачом</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {result.questions.map((q, index) => (
                <li key={index}>{q}</li>
              ))}
            </ul>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {result.limitations}
            </p>
          </Card>
          <p className="text-sm text-muted-foreground">
            Это справочное объяснение текста, а не самостоятельная оценка обследования. Следуйте
            рекомендациям врача. При тяжёлом текущем состоянии обращайтесь за экстренной помощью.
          </p>
        </section>
      )}
    </div>
  );
}
