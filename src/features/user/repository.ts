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
  if (!user) throw new Error("로그?�이 ?�요?�니??");

  const payload: UserUpdateDB = {
    updated_at: new Date().toISOString(),
  };
  if (patch.display_name !== undefined) {
    if (patch.display_name !== null) {
      payload.display_name = patch.display_name;
    }
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
export async function listUsers(opts?: { limit?: number; cursor?: string }) {
  const supabase = getServerSupabase();
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  let query = supabase
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit + 1);

  if (opts?.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(opts.cursor, "base64url").toString("utf8")) as {
        created_at?: string;
        id?: string;
      };
      if (decoded?.created_at && decoded?.id) {
        query = query.or(
          `created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.gt.${decoded.id})`
        );
      }
    } catch {}
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as UserRow[];
  const hasExtra = rows.length > limit;
  const trimmed = hasExtra ? rows.slice(0, limit) : rows;
  const nextCursor = hasExtra
    ? Buffer.from(
        JSON.stringify({ created_at: rows[limit]?.created_at, id: rows[limit]?.id })
      ).toString("base64url")
    : null;
  return { items: trimmed, nextCursor };
}

export async function findUserByUsername(username: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .ilike("display_name", username)
    .maybeSingle();
  if (error) throw error;
  return (data as UserRow) ?? null;
}

export async function getUser(id: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as UserRow) ?? null;
}

export async function createUser(payload: any) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as UserRow;
}

export async function updateUser(id: string, patch: any) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as UserRow;
}

export async function deleteUser(id: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}


