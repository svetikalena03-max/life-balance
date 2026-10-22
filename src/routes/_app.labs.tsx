import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LAB_STATUS_LABELS, type LabRow } from "@/lib/lab-analysis";
import { explainLabResults, extractLabRows, recognizeLabDocument } from "@/lib/lab.functions";

export const Route = createFileRoute("/_app/labs")({ component: LabPage });
type Result = Awaited<ReturnType<typeof explainLabResults>>;
const emptyRow = (): LabRow => ({ name: "", value: "", unit: "", reference: "" });

function LabPage() {
  const recognize = useServerFn(recognizeLabDocument);
  const extract = useServerFn(extractLabRows);
  const explain = useServerFn(explainLabResults);
  const [rows, setRows] = useState<LabRow[]>([emptyRow()]);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasData = rows.some((row) => row.name || row.value);
  const invalidate = () => {
    setReviewed(false);
    setResult(null);
    setError("");
  };
  const update = (index: number, key: keyof LabRow, value: string) => {
    invalidate();
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!consent) {
      setError("Сначала подтвердите отправку данных для разбора.");
      return;
    }
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Выберите JPEG, PNG или одностраничный PDF до 2 МБ. HEIC нужно сохранить как JPEG.");
      return;
    }
    if (
      text.trim() &&
      !window.confirm("Заменить текущий текст текстом из файла? Карточки показателей сохранятся.")
    )
      return;
    setBusy("Читаем файл…");
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("Не удалось открыть файл"));
        reader.readAsDataURL(file);
      });
      const response = await recognize({
        data: { content, mimeType: file.type as "image/jpeg" | "image/png" | "application/pdf" },
      });
      if (!response.ok) throw new Error(response.error);
      setText(response.text);
      invalidate();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось прочитать файл. Вставьте текст вручную.",
      );
    } finally {
      setBusy("");
    }
  };

  const extractRows = async () => {
    if (hasData && !window.confirm("Заменить заполненные карточки показателями из текста?")) return;
    setBusy("Выделяем показатели…");
    setError("");
    setResult(null);
    try {
      const response = await extract({ data: { text } });
      if (!response.ok) throw new Error(response.error);
      setRows(response.rows);
      setReviewed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выделить показатели.");
    } finally {
      setBusy("");
    }
  };

  const analyze = async () => {
    setBusy("Готовим объяснение…");
    setError("");
    setResult(null);
    try {
      const response = await explain({ data: { rows, context } });
      if (!response.ok) throw new Error(response.error);
      setResult(response);
    } catch {
      setError(
        "Не удалось получить объяснение. Проверьте подключение и повторите — введённые данные остались в форме.",
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Разбор анализов"
        subtitle="Показатели простыми словами"
        backTo="/health"
        backLabel="Здоровье"
      />
      <Card className="space-y-3 p-4 text-sm">
        <p>
          Объясним, что измеряют показатели и что спросить у врача. Это справочная информация:
          приложение не ставит диагноз и не назначает лечение.
        </p>
        <p className="text-muted-foreground">
          Уберите ФИО, дату рождения, адрес и другие личные данные с бланка. Файл и разбор не
          сохраняются в истории приложения. При уходе со страницы или обновлении введённое будет
          потеряно.
        </p>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consent}
            disabled={!!busy}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            Разрешаю отправить выбранный файл, показатели и указанный контекст в сервисы Яндекса для
            распознавания и объяснения.
          </span>
        </label>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">1. Добавьте результаты</h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={upload}
        />
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={!consent || !!busy}
        >
          Загрузить фото или PDF
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG или PDF из одной страницы до 2 МБ. Для многостраничного бланка добавляйте
          показатели по одной странице. Проверяйте, что ни одна строка не пропущена.
        </p>
        <Label htmlFor="lab-text">Или вставьте текст бланка</Label>
        <Textarea
          id="lab-text"
          rows={5}
          maxLength={16000}
          disabled={!!busy}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            invalidate();
          }}
          placeholder="Название — результат — единицы — норма лаборатории"
        />
        <Button
          variant="secondary"
          onClick={extractRows}
          disabled={!consent || !text.trim() || !!busy}
        >
          Выделить показатели из текста
        </Button>
        <p className="text-xs text-muted-foreground">
          Можно сразу заполнить карточки ниже вручную.
        </p>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold">2. Сверьте цифры с бланком</h2>
        <p className="text-sm text-muted-foreground">
          Распознавание может ошибаться. Проверьте десятичные запятые, единицы и нормы именно вашей
          лаборатории. Норма должна относиться к тому же возрасту и состоянию, включая беременность.
        </p>
        {rows.map((row, index) => (
          <Card key={index} className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Показатель {index + 1}</h3>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Удалить показатель ${index + 1}`}
                disabled={!!busy}
                onClick={() => {
                  setRows((r) => r.filter((_, i) => i !== index));
                  invalidate();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["name", "Название", "Гемоглобин"],
                  ["value", "Результат", "125"],
                  ["unit", "Единицы", "г/л"],
                  ["reference", "Норма на бланке", "120–150"],
                ] as const
              ).map(([key, label, placeholder]) => (
                <div key={key} className={key === "name" ? "col-span-2 space-y-1" : "space-y-1"}>
                  <Label htmlFor={`lab-${index}-${key}`}>{label}</Label>
                  <Input
                    id={`lab-${index}-${key}`}
                    disabled={!!busy}
                    maxLength={key === "value" || key === "unit" ? 60 : 120}
                    value={row[key]}
                    placeholder={placeholder}
                    onChange={(e) => update(index, key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
        <Button
          variant="outline"
          disabled={!!busy || rows.length >= 40}
          onClick={() => {
            setRows((r) => [...r, emptyRow()]);
            invalidate();
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить показатель
        </Button>
      </section>

      <Card className="space-y-3 p-4">
        <Label htmlFor="lab-context">Контекст для объяснения — по желанию</Label>
        <Textarea
          id="lab-context"
          maxLength={1500}
          rows={3}
          disabled={!!busy}
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            invalidate();
          }}
          placeholder="Возраст, пол, беременность, жалобы, условия сдачи. Без ФИО."
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={reviewed}
            disabled={!!busy}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          <span>Я сверила(сверил) все показатели, единицы и нормы с бланком.</span>
        </label>
        <Button
          className="w-full"
          onClick={analyze}
          disabled={
            !consent ||
            !reviewed ||
            !!busy ||
            rows.length === 0 ||
            rows.some((r) => !r.name.trim() || !r.value.trim())
          }
        >
          Объяснить результаты
        </Button>
        {busy && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {busy}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </Card>

      {result?.ok && (
        <section className="space-y-3" aria-live="polite">
          <h2 className="text-lg font-semibold">Объяснение результатов</h2>
          {result.rows.map((row) => (
            <Card key={row.index} className="space-y-2 p-4">
              <h3 className="font-semibold">
                {row.name}: {row.value} {row.unit}
              </h3>
              <p className="text-sm">Норма на бланке: {row.reference || "не указана"}</p>
              <p
                className={`text-sm font-medium ${row.status === "within" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}
              >
                {LAB_STATUS_LABELS[row.status]}
              </p>
              <p className="whitespace-pre-wrap text-sm">
                {result.indicators.find((r) => r.index === row.index)?.explanation}
              </p>
            </Card>
          ))}
          <Card className="space-y-3 p-4">
            <h3 className="font-semibold">Что обсудить с врачом</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {result.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {result.limitations}
            </p>
          </Card>
          <p className="text-sm text-muted-foreground">
            Нормальный интервал не исключает заболевание, а отклонение само по себе не является
            диагнозом. Если лаборатория отметила результат как критический, оперативно свяжитесь с
            врачом. При тяжёлом текущем состоянии обращайтесь за экстренной помощью.
          </p>
        </section>
      )}
    </div>
  );
}
