import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { LEGAL_DOCUMENT_VERSION } from "@/lib/legal";

export type RegistrationProfile = Database["public"]["Tables"]["profiles"]["Row"];

export async function loadRegistrationState(client: SupabaseClient<Database>, userId: string) {
  const [profile, consents] = await Promise.all([
    client.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    client
      .from("legal_consents")
      .select("id")
      .eq("user_id", userId)
      .eq("privacy_policy_accepted", true)
      .eq("personal_data_accepted", true)
      .eq("user_agreement_accepted", true)
      .eq("medical_disclaimer_accepted", true)
      .eq("document_version", LEGAL_DOCUMENT_VERSION)
      .limit(1),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (consents.error) throw new Error(consents.error.message);
  return {
    profile: profile.data,
    complete: Boolean(
      profile.data &&
      profile.data.height !== null &&
      profile.data.current_weight !== null &&
      consents.data?.length,
    ),
  };
}
