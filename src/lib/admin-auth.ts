import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminOk = {
  user: User;
  admin: SupabaseClient<Database>;
  error: null;
};

type AdminFail = {
  user: null;
  admin: null;
  error: "Unauthorized" | "Forbidden";
};

/**
 * Authenticate an admin API call via Bearer access token (preferred)
 * or the request cookies. Returns a service-role client for the write path.
 */
export async function requireAdminApi(request: Request): Promise<AdminOk | AdminFail> {
  const supabase = await createClient();
  const header = request.headers.get("authorization");
  const bearer =
    header?.startsWith("Bearer ") && header.slice(7).trim()
      ? header.slice(7).trim()
      : "";

  let user: User | null = null;

  if (bearer) {
    try {
      const { data } = await supabase.auth.getUser(bearer);
      user = data.user;
    } catch {
      user = null;
    }
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return { user: null, admin: null, error: "Unauthorized" };
  }

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return { user: null, admin: null, error: "Forbidden" };
  }

  return { user, admin, error: null };
}
