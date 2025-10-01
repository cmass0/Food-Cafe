import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRow, UserUpdate } from "./types";

const USER_COLUMNS = "id, display_name, photo_url, role, email, created_at, updated_at, is_admin";

export async function getSelf(): Promise<UserRow | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as UserRow) ?? null;
}

export async function updateSelf(patch: UserUpdate): Promise<UserRow> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select(USER_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserRow;
}
