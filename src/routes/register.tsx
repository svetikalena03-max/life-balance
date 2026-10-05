import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { normalizeAuthEmail, useAuth } from "@/lib/auth";

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
    setSubmitting(true);
    try {
      const result = await signUp(normalizeAuthEmail(email), password, name.trim() || undefined);
      if (!result.ok) {
        setError(result.error ?? "Ошибка регистрации");
        return;
      }
      setPassword("");
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
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Анкета и обязательные согласия заполняются после подтверждения email и входа в
              аккаунт.
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Создаём..." : "Создать аккаунт"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
