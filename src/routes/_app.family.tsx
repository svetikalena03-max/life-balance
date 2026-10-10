import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/family")({ component: FamilyPage });

type Family = Database["public"]["Tables"]["families"]["Row"];
type Member = Database["public"]["Tables"]["family_members"]["Row"];

function FamilyPage() {
  const { user, ready } = useAuth();
  return <FamilyAccount key={user?.id ?? "signed-out"} userId={user?.id} ready={ready} />;
}

function FamilyAccount({ userId, ready }: { userId?: string; ready: boolean }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [membership, setMembership] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (ownerId: string) => {
    const [familyResult, memberResult] = await Promise.all([
      supabase.from("families").select("*").eq("owner_user_id", ownerId).maybeSingle(),
      supabase.from("family_members").select("*").eq("user_id", ownerId).maybeSingle(),
    ]);
    if (familyResult.error || memberResult.error)
      throw new Error("Данные семейной группы недоступны.");
    const owned = familyResult.data;
    let allMembers: Member[] = [];
    if (owned) {
      const result = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", owned.id)
        .order("joined_at", { ascending: true });
      if (result.error) throw new Error("Не удалось загрузить участников.");
      allMembers = result.data ?? [];
    }
    return { owned, membership: memberResult.data, allMembers };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setFamily(null);
      setMembership(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setFamily(null);
    setMembership(null);
    setMembers([]);
    refresh(userId)
      .then(({ owned, membership: joined, allMembers }) => {
        if (active) {
          setFamily(owned);
          setMembership(joined);
          setMembers(allMembers);
        }
      })
      .catch(() => {
        if (active) setError("Семейный доступ пока недоступен. Попробуйте позже.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, userId, refresh]);

  async function perform(action: () => Promise<void>) {
    if (!userId || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      const result = await refresh(userId);
      setFamily(result.owned);
      setMembership(result.membership);
      setMembers(result.allMembers);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось выполнить действие. Попробуйте позже.",
      );
    } finally {
      setBusy(false);
    }
  }

  const create = () =>
    perform(async () => {
      const { error: createError } = await supabase.rpc("create_family");
      if (createError) throw new Error("Не удалось создать семейную группу.");
      setNotice("Группа создана. Теперь можно пригласить близких.");
    });

  const createInvite = () =>
    perform(async () => {
      if (!family) return;
      const { data, error: inviteError } = await supabase.rpc("create_family_invite", {
        family: family.id,
      });
      if (inviteError || !data)
        throw new Error("Не удалось создать приглашение. Попробуйте позже.");
      setInvite(data);
      setNotice(
        "Код действует семь дней и подходит только для одного человека. Сохраните его сейчас.",
      );
    });

  const join = () =>
    perform(async () => {
      const inviteCode = code.trim().toLowerCase();
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(inviteCode)) {
        throw new Error("Введите код приглашения полностью.");
      }
      const { error: joinError } = await supabase.rpc("accept_family_invite", {
        invite_code: inviteCode,
      });
      if (joinError) throw new Error("Код не подошёл или уже использован. Попросите новый код.");
      setCode("");
      setNotice("Вы присоединились к семейной группе.");
    });

  const leave = () =>
    perform(async () => {
      if (
        !membership ||
        !window.confirm("Выйти из семейной группы? Ваши личные данные сохранятся.")
      )
        return;
      const { error: leaveError } = await supabase
        .from("family_members")
        .delete()
        .eq("family_id", membership.family_id)
        .eq("user_id", userId!);
      if (leaveError) throw new Error("Не удалось выйти из группы.");
      setNotice("Вы вышли из семейной группы.");
    });

  const remove = (member: Member) =>
    perform(async () => {
      if (!family || !window.confirm(`Исключить участника «${member.display_name}»?`)) return;
      const { error: removeError } = await supabase
        .from("family_members")
        .delete()
        .eq("family_id", family.id)
        .eq("user_id", member.user_id);
      if (removeError) throw new Error("Не удалось исключить участника.");
      setNotice("Участник исключён. Его личные данные остались в его аккаунте.");
    });

  const disband = () =>
    perform(async () => {
      if (
        !family ||
        !window.confirm("Расформировать группу? Аккаунты и личные данные участников сохранятся.")
      )
        return;
      const { error: deleteError } = await supabase
        .from("families")
        .delete()
        .eq("id", family.id)
        .eq("owner_user_id", userId!);
      if (deleteError) throw new Error("Не удалось расформировать группу.");
      setInvite("");
      setNotice("Группа расформирована. Личные аккаунты сохранены.");
    });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Семья" subtitle="Пригласите близких в общую группу" backTo="/profile" />
      <Card className="p-4 text-sm text-muted-foreground">
        У каждого участника свой вход, дневник и данные о здоровье. Другие члены семьи их не видят.
        Группа подготовит общий доступ к будущему семейному тарифу; платежей сейчас нет.
      </Card>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-foreground">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаем семейную группу…</p>
      ) : family ? (
        <>
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Ваша семейная группа</h2>
            <p className="text-sm text-muted-foreground">
              Вы организатор. Участников: {members.length}.
            </p>
            <Button disabled={busy} onClick={createInvite}>
              Создать код приглашения
            </Button>
            {invite && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-sm">
                  Передайте код близкому человеку лично. Он вводится в разделе «Семья» после
                  регистрации.
                </p>
                <p className="break-all font-mono text-sm" aria-label="Код приглашения">
                  {invite}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite);
                      setNotice("Код скопирован.");
                    } catch {
                      setError("Не удалось скопировать код. Выделите его и скопируйте вручную.");
                    }
                  }}
                >
                  Скопировать код
                </Button>
              </div>
            )}
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-2 border-t pt-3 text-sm"
              >
                <span className="min-w-0 truncate">{member.display_name}</span>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => remove(member)}>
                  Исключить
                </Button>
              </div>
            ))}
          </Card>
          <Button variant="outline" disabled={busy} onClick={disband}>
            Расформировать группу
          </Button>
        </>
      ) : membership ? (
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">Вы в семейной группе</h2>
          <p className="text-sm text-muted-foreground">Личные записи доступны только вам.</p>
          <Button variant="outline" disabled={busy} onClick={leave}>
            Выйти из группы
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Создать свою группу</h2>
            <Button disabled={busy} onClick={create}>
              Создать семейную группу
            </Button>
          </Card>
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold">Присоединиться к семье</h2>
            <p className="text-sm text-muted-foreground">Введите код от организатора семьи.</p>
            <Input
              aria-label="Код приглашения"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Код приглашения"
            />
            <Button disabled={busy || !code.trim()} onClick={join}>
              Присоединиться
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
