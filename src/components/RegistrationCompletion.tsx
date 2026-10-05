import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_PROFILE, ensureCurrentUserProfile, type Gender } from "@/lib/store";
import type { RegistrationProfile } from "@/lib/registration";
import { supabase } from "@/integrations/supabase/client";

export function RegistrationCompletion({
  userId,
  initialName,
  initialProfile,
  onComplete,
}: {
  userId: string;
  initialName?: string;
  initialProfile: RegistrationProfile | null;
  onComplete: () => void;
}) {
  const [name, setName] = useState(initialProfile?.name ?? initialName ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birth_date ?? "");
  const [gender, setGender] = useState<Gender>((initialProfile?.gender as Gender) ?? "female");
  const [height, setHeight] = useState(initialProfile?.height?.toString() ?? "");
  const [weight, setWeight] = useState(initialProfile?.current_weight?.toString() ?? "");
  const [target, setTarget] = useState(initialProfile?.target_weight?.toString() ?? "");
  const [agreeData, setAgreeData] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMedical, setAgreeMedical] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (!agreeData || !agreeTerms || !agreeMedical) {
      setError("Подтвердите все обязательные согласия");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || data.user?.id !== userId) {
        throw new Error("Сессия истекла. Войдите снова, чтобы сохранить анкету и согласия.");
      }
      const age = birthDate
        ? Math.max(
            1,
            Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)),
          )
        : 30;
      const profileResult = await ensureCurrentUserProfile({
        ...DEFAULT_PROFILE,
        name: name.trim() || "Друг",
        age,
        gender,
        height: Number(height) || 170,
        currentWeight: Number(weight) || 70,
        targetWeight: Number(target) || Number(weight) || 70,
        waterGoal: 2000,
        birthDate: birthDate || undefined,
        goal: "health",
      });
      if (!profileResult.ok) throw new Error(profileResult.error ?? "Не удалось сохранить профиль");
      // Save consents last: their presence marks successful completion of both steps.
      const { error: consentError } = await supabase.from("legal_consents").insert({
        user_id: userId,
        privacy_policy_accepted: agreeData,
        personal_data_accepted: agreeData,
        user_agreement_accepted: agreeTerms,
        medical_disclaimer_accepted: agreeMedical,
        document_version: "v1",
      });
      if (consentError) throw new Error(consentError.message);
      onComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить анкету и согласия");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md p-5">
      <h1 className="text-xl font-semibold">Завершите регистрацию</h1>
      <p className="my-3 text-sm text-muted-foreground">
        Заполните анкету и подтвердите согласия. Они сохранятся в вашем аккаунте после нажатия
        кнопки.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось завершить регистрацию</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="bd">Дата рождения</Label>
            <Input
              id="bd"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label>Пол</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Женский</SelectItem>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="other">Другой</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="h">Рост, см</Label>
            <Input
              id="h"
              type="number"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="w">Вес, кг</Label>
            <Input
              id="w"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
            />
          </div>
          <div className="col-span-2 flex min-w-0 flex-col gap-2">
            <Label htmlFor="tw">Целевой вес, кг</Label>
            <Input
              id="tw"
              type="number"
              step="0.1"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="65"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-3">
          <Agree
            checked={agreeData}
            onChange={setAgreeData}
            label={
              <>
                Согласен с{" "}
                <Link
                  to="/legal/$doc"
                  params={{ doc: "consent" }}
                  className="text-primary underline"
                >
                  обработкой персональных данных
                </Link>
              </>
            }
          />
          <Agree
            checked={agreeTerms}
            onChange={setAgreeTerms}
            label={
              <>
                Принимаю{" "}
                <Link to="/legal/$doc" params={{ doc: "terms" }} className="text-primary underline">
                  пользовательское соглашение
                </Link>
              </>
            }
          />
          <Agree
            checked={agreeMedical}
            onChange={setAgreeMedical}
            label={
              <>
                Ознакомлен с{" "}
                <Link
                  to="/legal/$doc"
                  params={{ doc: "medical" }}
                  className="text-primary underline"
                >
                  отказом от медицинской ответственности
                </Link>
              </>
            }
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохраняем..." : "Сохранить анкету и согласия"}
        </Button>
      </form>
    </Card>
  );
}
function Agree({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </label>
  );
}
