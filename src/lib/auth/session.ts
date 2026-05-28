import { getServerSupabase } from "@/lib/supabase/server";

export async function getUserOrNull() {
  const { data, error } = await (await getServerSupabase()).auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function requireAuth() {
  const user = await getUserOrNull();
  if (!user) {
    throw new Error("user값이 존재하지 않습니다");
  }
  return user;
}
