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

    // Storage files do not participate in the Auth foreign-key cascade. Remove
    // private photos before deleting Auth, so they cannot remain after account deletion.
    // The migration may not yet exist on older installations.
    const { data: recipes, error: recipeError } = await supabaseAdmin
      .from("user_recipes")
      .select("photo_path")
      .eq("user_id", data.user.id);
    if (recipeError && recipeError.code !== "42P01" && recipeError.code !== "PGRST205") {
      return { ok: false, error: "Не удалось подготовить удаление фотографий. Попробуйте позже." };
    }
    const paths = (recipes ?? [])
      .map((recipe) => recipe.photo_path)
      .filter((path): path is string => !!path);
    for (let start = 0; start < paths.length; start += 100) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("personal-recipe-photos")
        .remove(paths.slice(start, start + 100));
      if (storageError)
        return { ok: false, error: "Не удалось удалить фотографии рецептов. Попробуйте позже." };
    }

    // Hard deletion cascades to all public user tables, including recipes and consents.
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
