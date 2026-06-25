import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setTranslatorLang } from "@/lib/i18n-translator";

export type Theme = "light" | "dark";
export type Lang = "ru" | "en";

const THEME_KEY = "hg_theme";
const LANG_KEY = "hg_lang";

type Ctx = {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const SettingsCtx = createContext<Ctx | null>(null);

const DICT: Record<Lang, Record<string, string>> = {
  ru: {
    home: "Главная", diary: "Дневник", health: "Здоровье", history: "История",
    charts: "Графики", profile: "Профиль", settings: "Настройки",
    habits: "Мои привычки", healthFeatures: "Особенности здоровья",
    weight: "Вес", water: "Вода", sleep: "Сон", pressure: "Давление",
    pulse: "Пульс", mood: "Настроение", energy: "Энергия",
    save: "Сохранить", back: "Назад", signIn: "Войти", signUp: "Зарегистрироваться",
    signOut: "Выйти",
    theme: "Тема", language: "Язык",
    light: "Светлая", dark: "Тёмная",
    appSettings: "Настройки приложения",
    appSettingsHint: "Тема, язык, отображение",
    settingsSaved: "Настройки сохранены",
    landing_subtitle: "Ваш персональный помощник по здоровью, питанию, активности и хорошему самочувствию.",
    landing_features: "Что умеет приложение",
    landing_audience: "Для кого",
    landing_why: "Почему это полезно",
    landing_why_text: "Приложение помогает видеть взаимосвязь между:",
    f_diary: "Дневник питания", f_weight: "Контроль веса", f_water: "Контроль воды",
    f_sleep: "Контроль сна", f_bp: "Давление и пульс", f_mood: "Настроение и энергия",
    f_habits: "Контроль привычек", f_voice: "Голосовой дневник", f_ai: "AI-анализ здоровья",
    f_reco: "Персональные рекомендации", f_menu: "Меню на следующий день",
    a_all: "Для мужчин и женщин любого возраста", a_lose: "Для желающих похудеть",
    a_chronic: "Для людей с хроническими заболеваниями", a_bp: "Для контроля давления",
    a_sleep: "Для улучшения сна", a_habits: "Для формирования полезных привычек",
    w_food: "питанием", w_weight: "весом", w_water: "водой", w_sleep: "сном",
    w_mood: "настроением", w_bp: "давлением", w_well: "самочувствием",
    legal_privacy: "Политика конфиденциальности",
    legal_terms: "Пользовательское соглашение",
    legal_consent: "Согласие на обработку данных",
    legal_medical: "Медицинский отказ",
  },
  en: {
    home: "Home", diary: "Diary", health: "Health", history: "History",
    charts: "Charts", profile: "Profile", settings: "Settings",
    habits: "My habits", healthFeatures: "Health features",
    weight: "Weight", water: "Water", sleep: "Sleep", pressure: "Blood pressure",
    pulse: "Pulse", mood: "Mood", energy: "Energy",
    save: "Save", back: "Back", signIn: "Sign in", signUp: "Sign up",
    signOut: "Sign out",
    theme: "Theme", language: "Language",
    light: "Light", dark: "Dark",
    appSettings: "App settings",
    appSettingsHint: "Theme, language, display",
    settingsSaved: "Settings saved",
    landing_subtitle: "Your personal assistant for health, nutrition, activity and well-being.",
    landing_features: "What the app does",
    landing_audience: "Who it's for",
    landing_why: "Why it helps",
    landing_why_text: "The app helps you see connections between:",
    f_diary: "Food diary", f_weight: "Weight control", f_water: "Water tracking",
    f_sleep: "Sleep tracking", f_bp: "Blood pressure & pulse", f_mood: "Mood & energy",
    f_habits: "Habit tracking", f_voice: "Voice diary", f_ai: "AI health analysis",
    f_reco: "Personal recommendations", f_menu: "Next-day menu",
    a_all: "For men and women of any age", a_lose: "For those wanting to lose weight",
    a_chronic: "For people with chronic conditions", a_bp: "For blood pressure control",
    a_sleep: "For better sleep", a_habits: "For building healthy habits",
    w_food: "nutrition", w_weight: "weight", w_water: "water", w_sleep: "sleep",
    w_mood: "mood", w_bp: "blood pressure", w_well: "well-being",
    legal_privacy: "Privacy Policy",
    legal_terms: "Terms of Service",
    legal_consent: "Data Processing Consent",
    legal_medical: "Medical Disclaimer",
  },
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [lang, setLangState] = useState<Lang>("ru");

  // initial load from localStorage
  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "light";
    const l = (localStorage.getItem(LANG_KEY) as Lang | null) ?? "ru";
    setThemeState(t);
    setLangState(l);
    applyTheme(t);
    applyLang(l);
  }, []);

  // sync from profile on auth
  useEffect(() => {
    const sync = async (uid: string | undefined) => {
      if (!uid) return;
      const { data } = await supabase.from("profiles").select("theme,language").eq("user_id", uid).maybeSingle();
      if (data?.theme === "light" || data?.theme === "dark") {
        setThemeState(data.theme);
        applyTheme(data.theme);
        localStorage.setItem(THEME_KEY, data.theme);
      }
      if (data?.language === "ru" || data?.language === "en") {
        setLangState(data.language);
        applyLang(data.language);
        localStorage.setItem(LANG_KEY, data.language);
      }
    };
    supabase.auth.getSession().then(({ data }) => sync(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => sync(session?.user.id));
    return () => sub.subscription.unsubscribe();
  }, []);

  const persist = async (patch: { theme?: Theme; language?: Lang }) => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await supabase.from("profiles").update(patch).eq("user_id", uid);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem(THEME_KEY, t);
    void persist({ theme: t });
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    applyLang(l);
    localStorage.setItem(LANG_KEY, l);
    void persist({ language: l });
  };

  const t = (key: string) => DICT[lang][key] ?? DICT.ru[key] ?? key;

  return (
    <SettingsCtx.Provider value={{ theme, lang, setTheme, setLang, t }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) {
    // fallback no-op (avoids crashes when used outside provider during SSR)
    return {
      theme: "light" as Theme,
      lang: "ru" as Lang,
      setTheme: () => {},
      setLang: () => {},
      t: (k: string) => DICT.ru[k] ?? k,
    };
  }
  return ctx;
}
