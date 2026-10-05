import "@tanstack/react-start/server-only";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DeleteAccountResult } from "./account.functions";

export async function deleteAuthenticatedAccount(): Promise<DeleteAccountResult> {
  // Fail before any Auth or database operation if server credentials are absent.
  if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      ok: false,
      error: "Удаление аккаунта недоступно: сервер не настроен. Обратитесь в поддержку.",
    };
  }

  const authorization = getRequest().headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return { ok: false, error: "Для удаления аккаунта войдите в систему заново." };
  }

  try {
    // Ask Auth to validate the current session; never trust a client-supplied ID
    // or decode JWT claims without checking them with Supabase.
    const { data, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !data.user) {
      return { ok: false, error: "Сессия недействительна. Войдите в систему заново." };
    }

    // Hard deletion cascades to all six public user tables, including consents.
    // Do not delete their rows first: a failed Auth deletion must retain the data.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user.id, false);
    if (error) {
      return {
        ok: false,
        error: "Не удалось удалить аккаунт. Попробуйте позже или обратитесь в поддержку.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Сервис удаления недоступен. Попробуйте позже или обратитесь в поддержку.",
    };
  }
}
