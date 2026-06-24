import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Eye, EyeOff } from "lucide-react";
import { normalizeAuthEmail, useAuth } from "@/lib/auth";
import { checkAuthDebugUser, resetDebugUser } from "@/lib/auth-debug.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход — Баланс жизни" },
      { name: "description", content: "Войдите в приложение Баланс жизни." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const checkDebugUser = useServerFn(checkAuthDebugUser);
  const resetTestUser = useServerFn(resetDebugUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lastAuthError, setLastAuthError] = useState<string>("");
  const [debugRegistered, setDebugRegistered] = useState<string>("не проверено");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/home" });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const normalized = normalizeAuthEmail(email);
    if (!normalized) {
      setDebugRegistered("не проверено");
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await checkDebugUser({ data: { email: normalized } });
        setDebugRegistered(res.registered ? "да" : "нет");
      } catch (err) {
        setDebugRegistered(err instanceof Error ? err.message : "ошибка проверки");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [email, checkDebugUser]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setLastAuthError("");
    const normalizedEmail = normalizeAuthEmail(email);
    setEmail(normalizedEmail);
    setSubmitting(true);
    const res = await signIn(normalizedEmail, password);
    if (!res.ok) {
      const message = res.error ?? "Ошибка входа";
      setServerError(message);
      setLastAuthError(res.serverError ?? message);
      toast.error(message);
      setSubmitting(false);
      return;
    }
    toast.success("Вы успешно вошли");
    navigate({ to: "/home" });
  };

  const resetAccount = async () => {
    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail) {
      toast.error("Введите email тестового аккаунта");
      return;
    }
    await resetTestUser({ data: { email: normalizedEmail } });
    setEmail(normalizedEmail);
    setPassword("");
    setDebugRegistered("нет");
    setServerError(null);
    setLastAuthError("");
    toast.success("Тестовый аккаунт сброшен");
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Вход</h1>
          <p className="mt-1 text-sm text-muted-foreground">Добро пожаловать обратно</p>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmail((v) => normalizeAuthEmail(v))} required />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pass">Пароль</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Восстановить пароль
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="pass"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            <Button type="submit" size="lg" className="h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? "Входим..." : "Войти"}
            </Button>
            {import.meta.env.DEV && (
              <>
                <Button type="button" variant="outline" onClick={resetAccount} disabled={submitting}>
                  Сбросить тестовый аккаунт
                </Button>
                <Card className="p-3 text-xs text-muted-foreground">
                  <p>Текущий email: {normalizeAuthEmail(email) || "—"}</p>
                  <p>Зарегистрирован: {debugRegistered}</p>
                  <p>Статус авторизации: {ready ? (user ? "вошёл" : "не вошёл") : "проверка"}</p>
                  <p>Последняя ошибка Auth: {lastAuthError || "—"}</p>
                </Card>
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
