import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
