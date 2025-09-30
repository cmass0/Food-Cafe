import { getServerSupabase } from "@/lib/supabase";
import type { UserRow, UserUpdate } from "./types";

export async function getSelf(): Promise<UserRow | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data as UserRow;
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
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}

