import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useProfile } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { profile, ready } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !profile) {
      navigate({ to: "/" });
    }
  }, [ready, profile, navigate]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
