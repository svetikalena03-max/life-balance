import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RegistrationCompletion } from "@/components/RegistrationCompletion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadRegistrationState, type RegistrationProfile } from "@/lib/registration";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [registration, setRegistration] = useState<{
    userId: string;
    complete: boolean;
    profile: RegistrationProfile | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (ready && !userId) void navigate({ to: "/" });
  }, [ready, userId, navigate]);

  useEffect(() => {
    let cancelled = false;
    setRegistration(null);
    setError(null);
    if (userId) {
      loadRegistrationState(supabase, userId).then(
        (state) => {
          if (!cancelled) setRegistration({ userId, ...state });
        },
        (error) => {
          if (!cancelled)
            setError(error instanceof Error ? error.message : "Не удалось проверить регистрацию");
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  if (!ready || !user) return <p className="p-5">Проверяем вход...</p>;
  if (error)
    return (
      <div className="flex flex-col gap-3 p-5" role="alert">
        <p>Не удалось проверить профиль и согласия: {error}</p>
        <Button onClick={() => setAttempt((value) => value + 1)}>Повторить</Button>
        <Button variant="outline" onClick={() => void signOut()}>
          Выйти
        </Button>
      </div>
    );
  if (registration?.userId !== user.id)
    return <p className="p-5">Проверяем профиль и согласия...</p>;
  if (!registration.complete)
    return (
      <div className="flex flex-col gap-4 p-5">
        <RegistrationCompletion
          key={user.id}
          userId={user.id}
          initialName={user.name}
          initialProfile={registration.profile}
          initialConsents={user.registrationConsents}
          onComplete={() => setAttempt((value) => value + 1)}
        />
        <Button variant="outline" onClick={() => void signOut()}>
          Выйти
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
