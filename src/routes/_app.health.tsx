import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SaveSuccess } from "@/components/SaveSuccess";
import { useEntries, todayISO } from "@/lib/store";

export const Route = createFileRoute("/_app/health")({
  component: HealthPage,
});

function HealthPage() {
  const { entries, saveEntry, ready, saving } = useEntries();
  const today = todayISO();
  const existing = entries.find((e) => e.date === today);

  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [energy, setEnergy] = useState(7);
  const [edema, setEdema] = useState(false);
  const [heartburn, setHeartburn] = useState(false);
  const [bloating, setBloating] = useState(false);
  const [backPain, setBackPain] = useState(false);
  const [kneePain, setKneePain] = useState(false);
  const [stressed, setStressed] = useState(false);
  const [healthComment, setHealthComment] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setSys(existing.systolic != null ? String(existing.systolic) : "");
      setDia(existing.diastolic != null ? String(existing.diastolic) : "");
      setPulse(existing.pulse != null ? String(existing.pulse) : "");
      setEnergy(existing.energy ?? 7);
      setEdema(!!existing.edema);
      setHeartburn(!!existing.heartburn);
      setBloating(!!existing.bloating);
      setBackPain(!!existing.backPain);
      setKneePain(!!existing.kneePain);
      setStressed(!!existing.stressed);
      setHealthComment(existing.healthComment ?? "");
    }
  }, [ready, existing?.date]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await saveEntry({
      date: today,
      systolic: sys === "" ? undefined : Number(sys),
      diastolic: dia === "" ? undefined : Number(dia),
      pulse: pulse === "" ? undefined : Number(pulse),
      energy,
      edema, heartburn, bloating, backPain, kneePain, stressed,
      healthComment: healthComment || undefined,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Показатели здоровья сохранены");
    setSaved(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Здоровье" subtitle="Давление, пульс и самочувствие" />

      {saved && <SaveSuccess onContinue={() => setSaved(false)} />}

      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="sys">Верхнее давление</Label>
              <Input id="sys" type="number" inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="120" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="dia">Нижнее давление</Label>
              <Input id="dia" type="number" inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="80" />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="pulse">Пульс, уд/мин</Label>
              <Input id="pulse" type="number" inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="70" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Уровень энергии</Label>
              <span className="text-sm font-semibold text-primary">{energy}/10</span>
            </div>
            <Slider min={1} max={10} step={1} value={[energy]} onValueChange={(v) => setEnergy(v[0])} />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <ToggleRow label="Отёки" value={edema} onChange={setEdema} />
            <ToggleRow label="Изжога" value={heartburn} onChange={setHeartburn} />
            <ToggleRow label="Вздутие" value={bloating} onChange={setBloating} />
            <ToggleRow label="Боль в спине" value={backPain} onChange={setBackPain} />
            <ToggleRow label="Боль в коленях" value={kneePain} onChange={setKneePain} />
            <ToggleRow label="Стресс" value={stressed} onChange={setStressed} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hc">Комментарий к самочувствию</Label>
            <Textarea id="hc" rows={3} value={healthComment} onChange={(e) => setHealthComment(e.target.value)} placeholder="Что беспокоит, что хорошо…" />
          </div>

          <Button type="submit" size="lg" className="h-12 text-base font-semibold" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить здоровье"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="min-w-0 truncate text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
