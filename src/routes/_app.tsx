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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
