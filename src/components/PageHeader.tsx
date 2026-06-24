import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  subtitle,
  right,
  back = true,
  backTo = "/home",
  backLabel = "Назад",
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-2 pt-1 pb-3">
      {back && (
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 w-fit px-2 text-muted-foreground hover:text-foreground">
          <Link to={backTo}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
