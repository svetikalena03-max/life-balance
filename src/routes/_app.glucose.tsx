import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/glucose")({ component: GlucosePage });

type Reading = Database["public"]["Tables"]["glucose_readings"]["Row"];
const contexts = {
  fasting: "Натощак",
  before_meal: "До еды",
  after_1h: "Через 1 час после еды",
  after_2h: "Через 2 часа после еды",
  bedtime: "Перед сном",
  other: "Другое",
} as const;
type Context = keyof typeof contexts;

function localInput(when: Date) {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${when.getFullYear()}-${two(when.getMonth() + 1)}-${two(when.getDate())}T${two(when.getHours())}:${two(when.getMinutes())}`;
}

function csvCell(value: string | number) {
  let safe = String(value);
  // Notes may be entered by a user and later opened in a spreadsheet.
  if (/^[\s]*[=+\-@]/.test(safe) || /^[\t\r]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replaceAll('"', '""')}"`;
}

function exportCsv(readings: Reading[]) {
  const rows = [
    [
      "Дата и время (местное)",
      "Дата и время (UTC)",
      "Когда измерено",
      "Глюкоза (ммоль/л)",
      "Примечание",
    ],
    ...readings.map((reading) => [
      new Date(reading.measured_at).toLocaleString("ru-RU"),
      reading.measured_at,
      contexts[reading.context as Context] ?? "Другое",
      reading.value_mmol_l,
      reading.note,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `glucose-readings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function GlucosePage() {
  const { user, ready } = useAuth();
  return <GlucoseAccount key={user?.id ?? "signed-out"} userId={user?.id} ready={ready} />;
}

function GlucoseAccount({ userId, ready }: { userId?: string; ready: boolean }) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [when, setWhen] = useState("");
  const [value, setValue] = useState("");
  const [context, setContext] = useState<Context>("fasting");
  const [note, setNote] = useState("");

  const load = useCallback(async (owner: string) => {
    const { data, error: readError } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", owner)
      .order("measured_at", { ascending: false })
      .limit(500);
    if (readError) throw readError;
    return data ?? [];
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setReadings([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setReadings([]);
    setError("");
    load(userId)
      .then((rows) => {
        if (active) setReadings(rows);
      })
      .catch(() => {
        if (active) setError("Дневник сахара пока недоступен. Попробуйте позже.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, userId, load]);

  function reset() {
    setEditing(null);
    setValue("");
    setContext("fasting");
    setNote("");
    setWhen("");
  }

  function edit(reading: Reading) {
    setEditing(reading.id);
    setWhen(localInput(new Date(reading.measured_at)));
    setValue(String(reading.value_mmol_l));
    setContext(reading.context as Context);
    setNote(reading.note);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!userId || busy) return;
    const rawValue = value.trim().replace(",", ".");
    const number = Number(rawValue);
    const date = new Date(when);
    if (
      !/^\d{1,2}(?:\.\d{1,2})?$/.test(rawValue) ||
      !Number.isFinite(number) ||
      number <= 0 ||
      number > 99.99 ||
      !Number.isFinite(date.getTime()) ||
      date.getTime() > Date.now() + 5 * 60_000 ||
      !Object.hasOwn(contexts, context) ||
      note.length > 500
    ) {
      setError("Проверьте время, показатель в ммоль/л и примечание (до 500 символов).");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      measured_at: date.toISOString(),
      value_mmol_l: number,
      context,
      note: note.trim(),
    };
    try {
      const query = editing
        ? supabase.from("glucose_readings").update(payload).eq("id", editing).eq("user_id", userId)
        : supabase.from("glucose_readings").insert({ ...payload, user_id: userId });
      const { error: saveError } = await query.select("id").single();
      if (saveError) throw saveError;
      reset();
      setNotice("Измерение сохранено.");
      try {
        setReadings(await load(userId));
      } catch {
        setError("Измерение сохранено, но список не обновился. Откройте страницу ещё раз.");
      }
    } catch {
      setError("Не удалось сохранить измерение. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(reading: Reading) {
    if (!userId || busy || !window.confirm("Удалить это измерение?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: deleteError } = await supabase
        .from("glucose_readings")
        .delete()
        .eq("id", reading.id)
        .eq("user_id", userId)
        .select("id")
        .single();
      if (deleteError) throw deleteError;
      setReadings((previous) => previous.filter((item) => item.id !== reading.id));
      if (editing === reading.id) reset();
      setNotice("Измерение удалено.");
    } catch {
      setError("Не удалось удалить измерение.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Сахар крови"
        subtitle="Записывайте измерения для себя и врача"
        backTo="/health"
      />
      <Card className="p-4 text-sm text-muted-foreground">
        Вносите показания глюкометра в ммоль/л и время, когда измерили сахар. Частоту измерений и
        личные целевые значения уточняйте у лечащего врача. Приложение хранит записи, но не ставит
        диагноз и не оценивает результат.
      </Card>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">{editing ? "Изменить измерение" : "Новое измерение"}</h2>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="glucose-time">Дата и время измерения</Label>
              <Input
                id="glucose-time"
                required
                type="datetime-local"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                onFocus={() => {
                  if (!when) setWhen(localInput(new Date()));
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="glucose-value">Глюкоза, ммоль/л</Label>
              <Input
                id="glucose-value"
                required
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Например, 5,4"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="glucose-context">Когда измерено</Label>
            <select
              id="glucose-context"
              value={context}
              onChange={(event) => setContext(event.target.value as Context)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(contexts).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="glucose-note">Примечание (необязательно)</Label>
            <Textarea
              id="glucose-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например, после завтрака"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || loading}>
              {busy ? "Сохраняю…" : "Сохранить"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={reset}>
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">История измерений</h2>
          <p className="text-xs text-muted-foreground">Последние 500 записей</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!readings.length}
          onClick={() => exportCsv(readings)}
        >
          Скачать для врача (CSV)
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаем измерения…</p>
      ) : readings.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">Пока нет измерений.</Card>
      ) : (
        <div className="space-y-2">
          {readings.map((reading) => (
            <Card key={reading.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{reading.value_mmol_l} ммоль/л</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reading.measured_at).toLocaleString("ru-RU")} ·{" "}
                    {contexts[reading.context as Context] ?? "Другое"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => edit(reading)}
                  >
                    Изменить
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => remove(reading)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
              {reading.note && <p className="text-sm">{reading.note}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
