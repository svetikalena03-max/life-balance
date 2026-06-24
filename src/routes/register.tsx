import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEFAULT_PROFILE, ensureCurrentUserProfile, type Gender } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Регистрация — Баланс жизни" },
      { name: "description", content: "Создайте аккаунт в приложении Баланс жизни." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, ready, signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");

  const [agreeData, setAgreeData] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMedical, setAgreeMedical] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user && !submitting) navigate({ to: "/home" });
  }, [ready, user, submitting, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSubmitting(true);
    if (!agreeData || !agreeTerms || !agreeMedical) {
      toast.error("Подтвердите все обязательные согласия");
      setSubmitting(false);
      return;
    }
    const res = await signUp(email, password, name.trim() || undefined);
    if (!res.ok) {
      const message = res.error ?? "Ошибка регистрации";
      setServerError(message);
      toast.error(message);
      setSubmitting(false);
      return;
    }
    const age = birthDate
      ? Math.max(1, Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)))
      : 30;
    const profileRes = await ensureCurrentUserProfile({
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
    if (!profileRes.ok) {
      const message = profileRes.error ?? "Профиль не создан";
      setServerError(message);
      toast.error(message);
      setSubmitting(false);
      return;
    }
    const { data: sess } = await supabase.auth.getUser();
    if (sess.user) {
      const { error: consentError } = await supabase.from("legal_consents").insert({
        user_id: sess.user.id,
        privacy_policy_accepted: agreeData,
        personal_data_accepted: agreeData,
        user_agreement_accepted: agreeTerms,
        medical_disclaimer_accepted: agreeMedical,
        document_version: "v1",
      });
      if (consentError) {
        console.error("Supabase legal_consents insert error", {
          message: consentError.message,
          code: consentError.code,
          details: consentError.details,
          hint: consentError.hint,
        });
        setServerError(consentError.message);
        toast.error(consentError.message);
        setSubmitting(false);
        return;
      }
    }
    toast.success("Аккаунт создан");
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-secondary via-background to-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Регистрация</h1>
          <p className="mt-1 text-sm text-muted-foreground">Создайте аккаунт «Баланс жизни»</p>
        </div>

        <Card className="p-5">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertTitle>Ошибка Auth</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Анна" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmail((v) => v.trim().toLowerCase())} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pass">Пароль</Label>
              <div className="relative">
                <Input
                  id="pass"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="bd">Дата рождения</Label>
                <Input id="bd" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label>Пол</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Женский</SelectItem>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="other">Другой</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="h">Рост, см</Label>
                <Input id="h" type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="w">Вес, кг</Label>
                <Input id="w" type="number" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
              </div>
              <div className="col-span-2 flex min-w-0 flex-col gap-2">
                <Label htmlFor="tw">Целевой вес, кг</Label>
                <Input id="tw" type="number" step="0.1" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="65" />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <Agree
                checked={agreeData}
                onChange={setAgreeData}
                label={
                  <>
                    Согласен с{" "}
                    <Link to="/legal/$doc" params={{ doc: "consent" }} className="text-primary underline">
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
                    <Link to="/legal/$doc" params={{ doc: "medical" }} className="text-primary underline">
                      отказом от медицинской ответственности
                    </Link>
                  </>
                }
              />
            </div>

            <Button type="submit" size="lg" className="h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать аккаунт"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
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
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </label>
  );
}
