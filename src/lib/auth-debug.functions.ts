import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function findUserByEmail(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => normalizeEmail(user.email ?? "") === normalized);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

function assertDevelopmentMode() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Debug action is available only in development mode");
  }
}

export const checkAuthDebugUser = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: z.string() }).parse(data))
  .handler(async ({ data }) => {
    assertDevelopmentMode();
    const user = await findUserByEmail(data.email);
    return {
      registered: Boolean(user),
      confirmed: Boolean(user?.email_confirmed_at),
      hasPassword: Boolean(user?.app_metadata?.provider === "email" || user?.identities?.some((identity) => identity.provider === "email")),
    };
  });

export const resetDebugUser = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: z.string() }).parse(data))
  .handler(async ({ data }) => {
    assertDevelopmentMode();
    const user = await findUserByEmail(data.email);
    if (!user) return { ok: true, deleted: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return { ok: true, deleted: true };
  });