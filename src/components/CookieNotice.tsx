import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const COOKIE_NOTICE_KEY = "life_balance_cookie_notice_v1";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_NOTICE_KEY) !== "accepted");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
      <p className="text-sm font-semibold text-foreground">Файлы cookies и локальное хранилище</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Мы используем только необходимые технологии для входа, безопасности и сохранения ваших
        настроек. Рекламных cookies в приложении нет.{" "}
        <Link to="/legal/$doc" params={{ doc: "cookies" }} className="text-primary underline">
          Подробнее
        </Link>
      </p>
      <Button
        type="button"
        size="sm"
        className="mt-3 w-full"
        onClick={() => {
          localStorage.setItem(COOKIE_NOTICE_KEY, "accepted");
          setVisible(false);
        }}
      >
        Понятно
      </Button>
    </div>
  );
}
