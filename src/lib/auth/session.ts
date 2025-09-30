import { getServerSupabase } from "@/lib/supabase";

export async function getUserOrNull() {
  const { data, error } = await getServerSupabase().auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function requireAuth() {
  const user = await getUserOrNull();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  return user;
}

