import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/lib/settings";
import { toast } from "sonner";
import { Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, lang, setTheme, setLang, t } = useSettings();

  const choose = <T,>(value: T, setter: (v: T) => void) => (v: T) => {
    setter(v);
    toast.success(t("settingsSaved"));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("settings")} backTo="/profile" backLabel={`← ${t("back")}`} />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("theme")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            className="h-12 justify-center gap-2"
            onClick={() => choose(theme, setTheme)("light")}
          >
            <Sun className="h-4 w-4" /> {t("light")}
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            className="h-12 justify-center gap-2"
            onClick={() => choose(theme, setTheme)("dark")}
          >
            <Moon className="h-4 w-4" /> {t("dark")}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("language")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={lang === "ru" ? "default" : "outline"}
            className="h-12 justify-center font-semibold"
            onClick={() => choose(lang, setLang)("ru")}
          >
            RU · Русский
          </Button>
          <Button
            type="button"
            variant={lang === "en" ? "default" : "outline"}
            className="h-12 justify-center font-semibold"
            onClick={() => choose(lang, setLang)("en")}
          >
            EN · English
          </Button>
        </div>
      </Card>
    </div>
  );
}
