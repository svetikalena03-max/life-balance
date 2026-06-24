import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  BookOpen,
  Scale,
  Droplets,
  Moon,
  HeartPulse,
  Smile,
  CheckCircle2,
  Mic,
  Brain,
  Lightbulb,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Баланс жизни — здоровье, питание, сон" },
      {
        name: "description",
        content:
          "Персональный помощник по здоровью, питанию, активности и хорошему самочувствию.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: BookOpen, label: "Дневник питания" },
  { icon: Scale, label: "Контроль веса" },
  { icon: Droplets, label: "Контроль воды" },
  { icon: Moon, label: "Контроль сна" },
  { icon: HeartPulse, label: "Давление и пульс" },
  { icon: Smile, label: "Настроение и энергия" },
  { icon: CheckCircle2, label: "Контроль привычек" },
  { icon: Mic, label: "Голосовой дневник" },
  { icon: Brain, label: "AI-анализ здоровья" },
  { icon: Lightbulb, label: "Персональные рекомендации" },
  { icon: Utensils, label: "Меню на следующий день" },
];

const audience = [
  "Для мужчин и женщин любого возраста",
  "Для желающих похудеть",
  "Для людей с хроническими заболеваниями",
  "Для контроля давления",
  "Для улучшения сна",
  "Для формирования полезных привычек",
];

const why = ["питанием", "весом", "водой", "сном", "настроением", "давлением", "самочувствием"];

function LandingPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) navigate({ to: "/home" });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-secondary via-background to-background">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8">
        <header className="flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Баланс жизни
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Ваш персональный помощник по здоровью, питанию, активности и хорошему
            самочувствию.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/register" className="contents">
            <Button size="lg" className="h-12 w-full text-base font-semibold">
              Зарегистрироваться
            </Button>
          </Link>
          <Link to="/login" className="contents">
            <Button size="lg" variant="outline" className="h-12 w-full text-base font-semibold">
              Войти
            </Button>
          </Link>
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Что умеет приложение</h2>
          <ul className="grid gap-2">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-foreground">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">{label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Для кого</h2>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {audience.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Почему это полезно</h2>
          <p className="text-sm text-muted-foreground">
            Приложение помогает видеть взаимосвязь между:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {why.map((w) => (
              <span
                key={w}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {w}
              </span>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/register" className="contents">
            <Button size="lg" className="h-12 w-full text-base font-semibold">
              Зарегистрироваться
            </Button>
          </Link>
          <Link to="/login" className="contents">
            <Button size="lg" variant="outline" className="h-12 w-full text-base font-semibold">
              Войти
            </Button>
          </Link>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-6 text-center text-xs text-muted-foreground">
          <Link to="/legal/$doc" params={{ doc: "privacy" }} className="hover:text-foreground">
            Политика конфиденциальности
          </Link>
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="hover:text-foreground">
            Пользовательское соглашение
          </Link>
          <Link to="/legal/$doc" params={{ doc: "consent" }} className="hover:text-foreground">
            Согласие на обработку данных
          </Link>
          <Link to="/legal/$doc" params={{ doc: "medical" }} className="hover:text-foreground">
            Медицинский отказ
          </Link>
        </footer>
      </div>
    </div>
  );
}
