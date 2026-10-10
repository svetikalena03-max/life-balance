import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  localDate,
  optionalNumber,
  pregnancyCsv,
  pregnancyTerm,
  type PregnancyRecord,
} from "@/lib/pregnancy";

export const Route = createFileRoute("/_app/pregnancy")({ component: PregnancyPage });
const emptyDraft = () => ({
  date: localDate(),
  kind: "daily",
  weight: "",
  sys: "",
  dia: "",
  note: "",
  recommendations: "",
});

function PregnancyPage() {
  const { user, ready } = useAuth();
  const owner = user?.id;
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const [dueDate, setDueDate] = useState("");
  const [savedDueDate, setSavedDueDate] = useState("");
  const [records, setRecords] = useState<PregnancyRecord[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const term = pregnancyTerm(savedDueDate, localDate());
  const loadRecords = useCallback(async (id: string) => {
    const { data, error: problem } = await supabase
      .from("pregnancy_records")
      .select("*")
      .eq("user_id", id)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (problem) throw problem;
    return data ?? [];
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    setRecords([]);
    setDueDate("");
    setSavedDueDate("");
    setDraft(emptyDraft());
    setEditing(null);
    setNotice("");
    setError("");
    if (!owner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      supabase.from("pregnancy_settings").select("*").eq("user_id", owner).maybeSingle(),
      loadRecords(owner),
    ])
      .then(([settings, rows]) => {
        if (settings.error) throw settings.error;
        if (!active) return;
        setDueDate(settings.data?.due_date ?? "");
        setSavedDueDate(settings.data?.due_date ?? "");
        setRecords(rows);
      })
      .catch(() => {
        if (active)
          setError(
            "Не удалось загрузить дневник беременности. Проверьте соединение или попробуйте позже.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, owner, loadRecords]);

  async function saveDue(event: FormEvent) {
    event.preventDefault();
    if (!owner || busy) return;
    if (!dueDate || !pregnancyTerm(dueDate, localDate())) {
      setError("Проверьте предполагаемую дату родов. Укажите дату, согласованную с врачом.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: problem } = await supabase
        .from("pregnancy_settings")
        .upsert({ user_id: owner, due_date: dueDate, updated_at: new Date().toISOString() });
      if (problem) throw problem;
      if (currentOwner.current === owner) {
        setSavedDueDate(dueDate);
        setNotice("Дата родов сохранена.");
      }
    } catch {
      if (currentOwner.current === owner) setError("Не удалось сохранить дату родов.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRecord(event: FormEvent) {
    event.preventDefault();
    if (!owner || busy) return;
    let payload;
    try {
      const parsed = new Date(`${draft.date}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
        !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== draft.date ||
        (draft.kind === "daily" && draft.date > localDate()) ||
        !["daily", "visit"].includes(draft.kind)
      )
        throw new Error("date");
      const sys = optionalNumber(draft.sys, 400, true);
      const dia = optionalNumber(draft.dia, 400, true);
      if (
        (sys === null) !== (dia === null) ||
        draft.note.length > 2000 ||
        draft.recommendations.length > 2000
      )
        throw new Error("fields");
      payload = {
        record_date: draft.date,
        kind: draft.kind,
        weight_kg: optionalNumber(draft.weight, 500),
        systolic: sys,
        diastolic: dia,
        note: draft.note.trim(),
        recommendations: draft.recommendations.trim(),
        updated_at: new Date().toISOString(),
      };
      if (!payload.note && !payload.recommendations && payload.weight_kg === null && sys === null)
        throw new Error("empty");
    } catch {
      setError(
        "Проверьте дату и показатели. Для давления заполните оба числа. Добавьте хотя бы один показатель или заметку.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = editing
        ? await supabase
            .from("pregnancy_records")
            .update(payload)
            .eq("id", editing)
            .eq("user_id", owner)
            .select("id")
            .single()
        : await supabase
            .from("pregnancy_records")
            .insert({ ...payload, user_id: owner })
            .select("id")
            .single();
      if (result.error) throw result.error;
      if (currentOwner.current !== owner) return;
      setDraft(emptyDraft());
      setEditing(null);
      setNotice("Запись сохранена.");
      try {
        const rows = await loadRecords(owner);
        if (currentOwner.current === owner) setRecords(rows);
      } catch {
        if (currentOwner.current === owner)
          setError("Запись сохранена, но список не обновился. Обновите страницу.");
      }
    } catch {
      if (currentOwner.current === owner)
        setError("Не удалось сохранить запись. Введённый текст оставлен в форме.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(record: PregnancyRecord) {
    if (!owner || busy || !window.confirm("Удалить эту запись беременности?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: problem } = await supabase
        .from("pregnancy_records")
        .delete()
        .eq("id", record.id)
        .eq("user_id", owner)
        .select("id")
        .single();
      if (problem) throw problem;
      if (currentOwner.current === owner) {
        setRecords((rows) => rows.filter((r) => r.id !== record.id));
        if (editing === record.id) {
          setEditing(null);
          setDraft(emptyDraft());
        }
        setNotice("Запись удалена.");
      }
    } catch {
      if (currentOwner.current === owner) setError("Не удалось удалить запись.");
    } finally {
      setBusy(false);
    }
  }

  function edit(record: PregnancyRecord) {
    setEditing(record.id);
    setDraft({
      date: record.record_date,
      kind: record.kind,
      weight: record.weight_kg === null ? "" : String(record.weight_kg),
      sys: record.systolic === null ? "" : String(record.systolic),
      dia: record.diastolic === null ? "" : String(record.diastolic),
      note: record.note,
      recommendations: record.recommendations,
    });
    setError("");
    setNotice("");
    document.getElementById("pregnancy-entry")?.scrollIntoView({ behavior: "smooth" });
  }

  function download() {
    const url = URL.createObjectURL(
      new Blob([pregnancyCsv(records)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pregnancy-${localDate()}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  const field = (key: keyof typeof draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const disabled = busy || loading || !owner;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Беременность"
        subtitle="Ваш дневник наблюдений и визитов к врачу"
        backTo="/health"
      />
      <Card className="space-y-2 p-4 text-sm text-muted-foreground">
        <p>
          Личные записи для вас и врача. Показатели сохраняются без оценки нормы и назначения
          лечения. Срок рассчитан приблизительно по предполагаемой дате родов.
        </p>
        <p>
          Для ограничений тренировок и AI-подбора рецептов отметьте беременность в{" "}
          <Link to="/health-features" className="underline">
            особенностях здоровья
          </Link>
          .
        </p>
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
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Срок беременности</h2>
        {term && (
          <p className="text-2xl font-semibold text-primary">
            {term.weeks} нед. {term.days} дн.
          </p>
        )}
        <form onSubmit={saveDue} className="space-y-3">
          <Label htmlFor="pregnancy-due">Предполагаемая дата родов, указанная врачом</Label>
          <Input
            id="pregnancy-due"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Button disabled={disabled}>Сохранить дату</Button>
        </form>
      </Card>
      <Link to="/glucose" className="rounded-xl border bg-card p-4 font-semibold text-primary">
        Сахар крови →
      </Link>
      <Card id="pregnancy-entry" className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">{editing ? "Изменить запись" : "Новая запись"}</h2>
        <form onSubmit={saveRecord} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pregnancy-kind">Что записать</Label>
              <select
                id="pregnancy-kind"
                value={draft.kind}
                onChange={(e) => field("kind", e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="daily">Самочувствие</option>
                <option value="visit">Визит к врачу</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pregnancy-date">
                Дата {draft.kind === "visit" ? "визита" : "записи"}
              </Label>
              <Input
                id="pregnancy-date"
                type="date"
                required
                value={draft.date}
                onChange={(e) => field("date", e.target.value)}
              />
            </div>
          </div>
          {draft.kind === "visit" && (
            <p className="text-sm text-muted-foreground">
              Можно записать прошедший или запланированный визит.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="pregnancy-weight">Вес, кг</Label>
              <Input
                id="pregnancy-weight"
                inputMode="decimal"
                value={draft.weight}
                onChange={(e) => field("weight", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pregnancy-sys">Давление, верхнее</Label>
              <Input
                id="pregnancy-sys"
                inputMode="numeric"
                value={draft.sys}
                onChange={(e) => field("sys", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pregnancy-dia">Давление, нижнее</Label>
              <Input
                id="pregnancy-dia"
                inputMode="numeric"
                value={draft.dia}
                onChange={(e) => field("dia", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pregnancy-note">
              {draft.kind === "visit"
                ? "Врач, цель визита и ваши вопросы"
                : "Самочувствие и заметки"}
            </Label>
            <Textarea
              id="pregnancy-note"
              rows={3}
              maxLength={2000}
              value={draft.note}
              onChange={(e) => field("note", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pregnancy-rec">Рекомендации врача (если есть)</Label>
            <Textarea
              id="pregnancy-rec"
              rows={3}
              maxLength={2000}
              value={draft.recommendations}
              onChange={(e) => field("recommendations", e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={disabled}>{busy ? "Сохраняю…" : "Сохранить запись"}</Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setDraft(emptyDraft());
                }}
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Записи и визиты</h2>
          <p className="text-xs text-muted-foreground">
            Последние 500 записей · не дублируются в общем дневнике
          </p>
        </div>
        <Button variant="outline" disabled={!records.length || loading} onClick={download}>
          Скачать для врача (CSV)
        </Button>
      </div>
      {loading ? (
        <p>Загружаем дневник…</p>
      ) : records.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Пока нет записей. Добавьте самочувствие или визит к врачу.
        </Card>
      ) : (
        records.map((record) => (
          <Card key={record.id} className="space-y-3 p-4">
            <p className="font-semibold">
              {record.record_date.split("-").reverse().join(".")} ·{" "}
              {record.kind === "visit" ? "Визит к врачу" : "Самочувствие"}
            </p>
            {(record.weight_kg !== null || record.systolic !== null) && (
              <p className="text-sm">
                {record.weight_kg !== null && `Вес: ${record.weight_kg} кг. `}
                {record.systolic !== null &&
                  `Давление: ${record.systolic}/${record.diastolic} мм рт. ст.`}
              </p>
            )}
            {record.note && (
              <p className="whitespace-pre-wrap break-words text-sm">{record.note}</p>
            )}
            {record.recommendations && (
              <div className="text-sm">
                <p className="font-semibold">Рекомендации врача</p>
                <p className="whitespace-pre-wrap break-words">{record.recommendations}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => edit(record)}>
                Изменить
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => remove(record)}>
                Удалить
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
