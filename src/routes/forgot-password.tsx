import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Восстановление пароля — Баланс жизни" },
      { name: "description", content: "Сброс пароля для входа в Баланс жизни." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = resetPassword(email, password);
    if (!res.ok) {
      toast.error(res.error ?? "Не удалось сбросить пароль");
      return;
    }
    toast.success("Пароль обновлён");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-secondary via-background to-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Сброс пароля</h1>
          <p className="mt-1 text-sm text-muted-foreground">Введите email и новый пароль</p>
        </div>

        <Card className="p-5">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pass">Новый пароль</Label>
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
            <Button type="submit" size="lg" className="h-12 text-base font-semibold">
              Сохранить новый пароль
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
