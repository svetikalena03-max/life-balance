import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { normalizeAuthEmail, useAuth } from "@/lib/auth";
import { createRegistrationConsents } from "@/lib/legal";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Регистрация — Баланс жизни" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, ready, signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMedical, setAgreeMedical] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user && !submitting) void navigate({ to: "/home" });
  }, [ready, user, submitting, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || message) return;
    setError(null);
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (!agreeData || !agreeTerms || !agreeMedical) {
      setError("Поставьте все обязательные галочки перед созданием аккаунта");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUp(
        normalizeAuthEmail(email),
        password,
        name.trim() || undefined,
        createRegistrationConsents(),
      );
      if (!result.ok) {
        setError(result.error ?? "Ошибка регистрации");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      if (result.requiresEmailConfirmation) {
        setMessage(
          "Письмо отправлено. Подтвердите адрес электронной почты по ссылке в письме, затем войдите в аккаунт. После входа заполните анкету и подтвердите согласия.",
        );
      } else {
        await navigate({ to: "/home" });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ошибка регистрации");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      <Link to="/">Назад</Link>
      <h1 className="text-2xl font-bold">Регистрация</h1>
      <Card className="p-5">
        {message ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>Подтвердите email</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Link to="/login">
              <Button>Войти после подтверждения</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Ошибка регистрации</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Повторите пароль</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="pr-12"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                  title={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <Agree
                checked={agreeData}
                onChange={setAgreeData}
                label={
                  <>
                    Я ознакомилась с{" "}
                    <LegalLink doc="privacy">Политикой конфиденциальности</LegalLink> и даю{" "}
                    <LegalLink doc="consent">
                      согласие на обработку персональных данных, включая данные о здоровье
                    </LegalLink>
                  </>
                }
              />
              <Agree
                checked={agreeTerms}
                onChange={setAgreeTerms}
                label={
                  <>
                    Я принимаю <LegalLink doc="terms">Пользовательское соглашение</LegalLink>
                  </>
                }
              />
              <Agree
                checked={agreeMedical}
                onChange={setAgreeMedical}
                label={
                  <>
                    Я ознакомилась с{" "}
                    <LegalLink doc="medical">Медицинским предупреждением</LegalLink>
                  </>
                }
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Нажимая кнопку ниже, вы также подтверждаете, что ознакомились с{" "}
                <LegalLink doc="cookies">Политикой cookies</LegalLink>.
              </p>
            </div>
            <Button
              type="submit"
              disabled={submitting || !agreeData || !agreeTerms || !agreeMedical}
            >
              {submitting ? "Создаём..." : "Создать аккаунт"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function Agree({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </label>
  );
}

function LegalLink({ doc, children }: { doc: string; children: React.ReactNode }) {
  return (
    <Link
      to="/legal/$doc"
      params={{ doc }}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
