import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRow, UserUpdate, UserUpdateDB } from "./types";

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

  const payload: UserUpdateDB = {
    updated_at: new Date().toISOString(),
  };
  if (patch.display_name !== undefined) {
    if (patch.display_name !== null) {
      payload.display_name = patch.display_name;
    }
    // null이면 컬럼을 수정하지 않습니다 (NOT NULL 보호)
  }
  if (patch.photo_url !== undefined) {
    payload.photo_url = patch.photo_url ?? null;
  }

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", user.id)
    .select(USER_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserRow;
}