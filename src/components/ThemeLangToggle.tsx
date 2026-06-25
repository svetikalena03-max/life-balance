import { Sun, Moon, Languages } from "lucide-react";
import { useSettings } from "@/lib/settings";

export function ThemeLangToggle() {
  const { theme, lang, setTheme, setLang } = useSettings();
  return (
    <div className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border border-border bg-card/90 px-1 py-1 shadow-sm backdrop-blur">
      <button
        type="button"
        aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="grid h-8 w-8 place-items-center rounded-full text-foreground hover:bg-accent"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button
        type="button"
        aria-label="Сменить язык"
        onClick={() => setLang(lang === "ru" ? "en" : "ru")}
        className="flex h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-foreground hover:bg-accent"
      >
        <Languages className="h-4 w-4" />
        {lang.toUpperCase()}
      </button>
    </div>
  );
}
