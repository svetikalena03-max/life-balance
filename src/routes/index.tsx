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
import { useSettings } from "@/lib/settings";

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
  { icon: BookOpen, key: "f_diary" },
  { icon: Scale, key: "f_weight" },
  { icon: Droplets, key: "f_water" },
  { icon: Moon, key: "f_sleep" },
  { icon: HeartPulse, key: "f_bp" },
  { icon: Smile, key: "f_mood" },
  { icon: CheckCircle2, key: "f_habits" },
  { icon: Mic, key: "f_voice" },
  { icon: Brain, key: "f_ai" },
  { icon: Lightbulb, key: "f_reco" },
  { icon: Utensils, key: "f_menu" },
];

const audienceKeys = ["a_all", "a_lose", "a_chronic", "a_bp", "a_sleep", "a_habits"];
const whyKeys = ["w_food", "w_weight", "w_water", "w_sleep", "w_mood", "w_bp", "w_well"];

function LandingPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { t } = useSettings();

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
            {t("landing_subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/register" className="contents">
            <Button size="lg" className="h-12 w-full text-base font-semibold">
              {t("signUp")}
            </Button>
          </Link>
          <Link to="/login" className="contents">
            <Button size="lg" variant="outline" className="h-12 w-full text-base font-semibold">
              {t("signIn")}
            </Button>
          </Link>
        </div>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t("landing_features")}</h2>
          <ul className="grid gap-2">
            {features.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-sm text-foreground">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">{t(key)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t("landing_audience")}</h2>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {audienceKeys.map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t("landing_why")}</h2>
          <p className="text-sm text-muted-foreground">{t("landing_why_text")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {whyKeys.map((k) => (
              <span
                key={k}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {t(k)}
              </span>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/register" className="contents">
            <Button size="lg" className="h-12 w-full text-base font-semibold">
              {t("signUp")}
            </Button>
          </Link>
          <Link to="/login" className="contents">
            <Button size="lg" variant="outline" className="h-12 w-full text-base font-semibold">
              {t("signIn")}
            </Button>
          </Link>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-6 text-center text-xs text-muted-foreground">
          <Link to="/legal/$doc" params={{ doc: "privacy" }} className="hover:text-foreground">
            {t("legal_privacy")}
          </Link>
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="hover:text-foreground">
            {t("legal_terms")}
          </Link>
          <Link to="/legal/$doc" params={{ doc: "consent" }} className="hover:text-foreground">
            {t("legal_consent")}
          </Link>
          <Link to="/legal/$doc" params={{ doc: "medical" }} className="hover:text-foreground">
            {t("legal_medical")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
