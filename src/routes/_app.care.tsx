import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_app/care")({ component: CarePage });
type Recipient = Pick<Database["public"]["Tables"]["care_recipients"]["Row"], "id" | "display_name" | "consent_confirmed">;
type CareEvent = Pick<Database["public"]["Tables"]["care_events"]["Row"], "id" | "recipient_id" | "category" | "details" | "event_at">;
const categories: Record<string, string> = {
 bp: "Давление и пульс", medication: "Лекарство", meal: "Питание",
 hydration: "Вода", hygiene: "Гигиена", position: "Положение тела",
 wellbeing: "Самочувствие", caregiver_visit: "Помощник", note: "Заметка"
};

function CarePage() {
 const { user } = useAuth();
 const [people, setPeople] = useState<Recipient[]>([]);
 const [selected, setSelected] = useState("");
 const [events, setEvents] = useState<CareEvent[]>([]);
 const [name, setName] = useState("");
 const [consent, setConsent] = useState(false);
 const [category, setCategory] = useState("bp");
 const [details, setDetails] = useState("");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [message, setMessage] = useState("");
 const [loaded, setLoaded] = useState(false);

 async function reloadPeople() {
  const { data, error: err } = await supabase.from("care_recipients").select("id,display_name,consent_confirmed").order("created_at", { ascending: true });
  if (err) throw err;
  const list = (data ?? []) as Recipient[];
  setPeople(list);
  setSelected(previous => list.some(p => p.id === previous) ? previous : (list[0]?.id ?? ""));
 }
 async function reloadEvents(id: string) {
  if (!id) { setEvents([]); return; }
  const { data, error: err } = await supabase.from("care_events").select("id,recipient_id,category,details,event_at").eq("recipient_id", id).order("event_at", { ascending: false }).limit(100);
  if (err) throw err;
  setEvents((data ?? []) as CareEvent[]);
 }
 useEffect(() => {
  if (!user) return;
  let active = true;
  setError("");
  setLoaded(false);
  void (async () => {
   try {
    const { data, error: err } = await supabase.from("care_recipients")
     .select("id,display_name,consent_confirmed")
     .order("created_at", { ascending: true });
    if (!active) return;
    if (err) throw err;
    const list = data ?? [];
    setPeople(list);
    setSelected(list[0]?.id ?? "");
   } catch {
    if (active) setError("Не удалось подключиться к базе или таблицы дневника ещё не созданы.");
   } finally {
    if (active) setLoaded(true);
   }
  })();
  return () => { active = false; };
 }, [user?.id]);
 useEffect(() => {
  if (!selected) { setEvents([]); return; }
  let active = true;
  void (async () => {
   try {
    const { data, error: err } = await supabase.from("care_events")
     .select("id,recipient_id,category,details,event_at")
     .eq("recipient_id", selected)
     .order("event_at", { ascending: false })
     .limit(100);
    if (!active) return;
    if (err) throw err;
    setEvents(data ?? []);
   } catch {
    if (active) setError("Не удалось загрузить записи.");
   }
  })();
  return () => { active = false; };
 }, [selected]);

 async function run(action: () => Promise<void>) {
  setBusy(true); setError(""); setMessage("");
  try { await action(); } catch { setError("Не удалось сохранить. Проверьте подключение и попробуйте ещё раз. Запись не сохранена."); }
  finally { setBusy(false); }
 }
 function addPerson() {
  if (!name.trim() || !consent || !user) return;
  void run(async () => {
   const { error: err } = await supabase.from("care_recipients").insert({ owner_user_id: user.id, display_name: name.trim(), consent_confirmed: true });
   if (err) throw err;
   setName(""); setConsent(false); await reloadPeople(); setMessage("Карточка создана.");
  });
 }
 function addEvent() {
  if (!selected || !details.trim() || !user) return;
  void run(async () => {
   const { error: err } = await supabase.from("care_events").insert({ recipient_id: selected, created_by: user.id, category, details: details.trim() });
   if (err) throw err;
   setDetails(""); await reloadEvents(selected); setMessage("Запись сохранена.");
  });
 }
 function removeEvent(id: string) {
  if (!window.confirm("Удалить запись?")) return;
  void run(async () => {
   const { error: err } = await supabase.from("care_events").delete().eq("id", id).eq("recipient_id", selected);
   if (err) throw err;
   await reloadEvents(selected); setMessage("Запись удалена.");
  });
 }
 return <div className="flex flex-col gap-4">
  <PageHeader title="Уход за близким" subtitle="Отдельный дневник наблюдений" backTo="/profile" />
  <Card className="p-4 text-sm text-muted-foreground">Записи о близком хранятся отдельно от вашего дневника. Указывайте только согласованные сведения. При внезапном ухудшении речи, слабости или асимметрии лица вызывайте скорую помощь.</Card>
  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  {message && <p role="status" className="text-sm text-primary">{message}</p>}
  {!loaded ? <p>Загрузка...</p> : <>
   {error.includes("таблицы дневника") || error.includes("подключиться") ? null : <>
   <Card className="space-y-3 p-4">
    <h2 className="font-semibold">Добавить близкого</h2>
    <Input aria-label="Имя или псевдоним" value={name} onChange={e => setName(e.target.value)} placeholder="Имя или псевдоним" maxLength={100}/>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1"/> Подтверждаю, что имею согласие человека или иное законное основание вести записи о его здоровье.</label>
    <Button disabled={busy || !name.trim() || !consent} onClick={addPerson}>Создать карточку</Button>
   </Card>
   {people.length > 0 && <>
    <Card className="space-y-3 p-4">
     <label className="block text-sm font-semibold" htmlFor="care-person">Подопечный</label>
     <select id="care-person" value={selected} onChange={e => setSelected(e.target.value)} className="w-full rounded-md border bg-background p-3">
      {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
     </select>
     <h2 className="font-semibold">Новая запись</h2>
     <div className="grid grid-cols-2 gap-2">
      {Object.entries(categories).map(([key,label]) => <Button type="button" key={key} variant={category===key?"default":"outline"} className="h-auto min-h-12 whitespace-normal text-xs" onClick={() => setCategory(key)}>{label}</Button>)}
     </div>
     <label className="block text-sm" htmlFor="care-details">Что произошло</label>
     <textarea id="care-details" value={details} onChange={e=>setDetails(e.target.value)} maxLength={2000} className="min-h-24 w-full rounded-md border bg-background p-3" placeholder="Например: 135/85, пульс 74, измерено утром"/>
     <Button size="lg" disabled={busy || !details.trim()} onClick={addEvent}>Сохранить запись</Button>
    </Card>
    <Card className="space-y-3 p-4">
     <h2 className="font-semibold">Последние записи</h2>
     {events.length===0 ? <p className="text-sm text-muted-foreground">Записей пока нет.</p> : events.map(event => <div className="space-y-1 border-t pt-3" key={event.id}>
      <p className="text-xs text-muted-foreground">{new Date(event.event_at).toLocaleString("ru-RU")}</p>
      <p className="font-medium">{categories[event.category] ?? event.category}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{event.details}</p>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => removeEvent(event.id)}>Удалить</Button>
     </div>)}
    </Card>
   </>}
   </>}
  </>}
 </div>;
}
