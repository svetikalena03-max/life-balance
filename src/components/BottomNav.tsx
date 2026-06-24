import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, HeartPulse, History, BarChart3, User } from "lucide-react";
import type { ComponentType } from "react";

const items: Array<{ to: string; label: string; icon: ComponentType<{ className?: string }> }> = [
  { to: "/home", label: "Главная", icon: Home },
  { to: "/diary", label: "Дневник", icon: BookOpen },
  { to: "/health", label: "Здоровье", icon: HeartPulse },
  { to: "/history", label: "История", icon: History },
  { to: "/charts", label: "Графики", icon: BarChart3 },
  { to: "/profile", label: "Профиль", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/home" && pathname.startsWith(to));
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
