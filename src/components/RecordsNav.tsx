import { Link, useRouterState } from "@tanstack/react-router";

export function RecordsNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      aria-label="Просмотр моих записей"
      className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"
    >
      {(
        [
          { to: "/history", label: "По дням" },
          { to: "/charts", label: "Графики" },
        ] as const
      ).map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={path === item.to ? "page" : undefined}
          className={`rounded-lg px-3 py-3 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path === item.to ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
