import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import {
  useProfile,
  type HealthFeatures,
  CHRONIC_OPTIONS,
  MUSCULO_OPTIONS,
  GI_OPTIONS,
  WOMEN_OPTIONS,
  TRAINING_OPTIONS,
} from "@/lib/store";

export const Route = createFileRoute("/_app/health-features")({
  component: HealthFeaturesPage,
});

type Opts = ReadonlyArray<readonly [string, string]>;

function HealthFeaturesPage() {
  const { user } = useAuth();
  return <HealthFeaturesAccount key={user?.id ?? "signed-out"} />;
}

function HealthFeaturesAccount() {
  const { profile, setProfile, ready, error } = useProfile();
  const navigate = useNavigate();
  const [hf, setHf] = useState<HealthFeatures>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHf(profile?.healthFeatures ?? {});
  }, [profile?.healthFeatures]);

  const toggle = (key: keyof HealthFeatures, value: string) => {
    setHf((p) => {
      const arr = (p[key] as string[] | undefined) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...p, [key]: next };
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !ready || error) return;
    setSaving(true);
    const base = profile ?? {
      name: "",
      age: 0,
      gender: "female" as const,
      height: 0,
      currentWeight: 0,
      targetWeight: 0,
    };
    const result = await setProfile({ ...base, healthFeatures: hf });
    setSaving(false);
    if (!result.ok) {
      toast.error("Не удалось сохранить особенности здоровья. Попробуйте ещё раз.");
      return;
    }
    toast.success("Особенности здоровья сохранены");
    navigate({ to: "/profile" });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Особенности здоровья"
        subtitle="Заболевания, ограничения, аллергии, важные симптомы"
        backTo="/profile"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось загрузить особенности здоровья. Попробуйте позже.
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Section title="Хронические заболевания">
          <Boxes
            options={CHRONIC_OPTIONS}
            values={hf.chronic}
            onToggle={(v) => toggle("chronic", v)}
          />
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="chronicOther">Если другое — укажите</Label>
            <Input
              id="chronicOther"
              value={hf.chronicOther ?? ""}
              onChange={(e) => setHf((p) => ({ ...p, chronicOther: e.target.value }))}
            />
          </div>
        </Section>

        <Section title="Опорно-двигательный аппарат">
          <Boxes
            options={MUSCULO_OPTIONS}
            values={hf.musculo}
            onToggle={(v) => toggle("musculo", v)}
          />
        </Section>

        <Section title="ЖКТ и питание">
          <Boxes options={GI_OPTIONS} values={hf.gi} onToggle={(v) => toggle("gi", v)} />
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="giInt">Какие продукты нельзя или плохо переносите</Label>
            <Textarea
              id="giInt"
              value={hf.giIntolerances ?? ""}
              onChange={(e) => setHf((p) => ({ ...p, giIntolerances: e.target.value }))}
            />
          </div>
        </Section>

        <Section title="Беременность">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={(hf.women ?? []).includes("pregnancy")}
              onCheckedChange={() => toggle("women", "pregnancy")}
            />
            Беременность
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            Отметка учитывается при ограничении готовых тренировок и AI-подбора рецептов. Сохраните
            изменения кнопкой внизу.
          </p>
          <Link
            to="/pregnancy"
            className="mt-3 inline-block text-sm font-semibold text-primary underline"
          >
            Открыть дневник беременности →
          </Link>
        </Section>

        <Section title="Женское здоровье">
          <Boxes
            options={WOMEN_OPTIONS.filter(([value]) => value !== "pregnancy")}
            values={hf.women}
            onToggle={(v) => toggle("women", v)}
          />
        </Section>

        <Section title="Лекарства и наблюдение врача">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!hf.takesMeds}
                onCheckedChange={(v) => setHf((p) => ({ ...p, takesMeds: !!v }))}
              />
              Принимаю лекарства
            </label>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meds">Какие лекарства или препараты</Label>
              <Textarea
                id="meds"
                value={hf.medsList ?? ""}
                onChange={(e) => setHf((p) => ({ ...p, medsList: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!hf.hasDoctorRec}
                onCheckedChange={(v) => setHf((p) => ({ ...p, hasDoctorRec: !!v }))}
              />
              Есть рекомендации врача
            </label>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc">Что врач рекомендовал</Label>
              <Textarea
                id="doc"
                value={hf.doctorRec ?? ""}
                onChange={(e) => setHf((p) => ({ ...p, doctorRec: e.target.value }))}
              />
            </div>
          </div>
        </Section>

        <Section title="Ограничения для тренировок">
          <Boxes
            options={TRAINING_OPTIONS}
            values={hf.training}
            onToggle={(v) => toggle("training", v)}
          />
        </Section>

        <Section title="Комментарий">
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">Что ещё важно учитывать</Label>
            <Textarea
              id="comment"
              rows={4}
              value={hf.comment ?? ""}
              onChange={(e) => setHf((p) => ({ ...p, comment: e.target.value }))}
            />
          </div>
        </Section>

        <Button
          type="submit"
          size="lg"
          disabled={saving || !ready || !!error}
          className="h-12 font-semibold"
        >
          {saving ? "Сохраняю…" : "Сохранить особенности здоровья"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </Card>
  );
}

function Boxes({
  options,
  values,
  onToggle,
}: {
  options: Opts;
  values?: string[];
  onToggle: (v: string) => void;
}) {
  const set = new Set(values ?? []);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map(([v, label]) => (
        <label key={v} className="flex items-center gap-2 text-sm">
          <Checkbox checked={set.has(v)} onCheckedChange={() => onToggle(v)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
