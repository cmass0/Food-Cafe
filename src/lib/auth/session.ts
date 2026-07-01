import { isAuthSessionMissingError } from "@/lib/auth/errors";
import { getServerSupabase } from "@/lib/supabase/server";

export async function getUserOrNull() {
  const { data, error } = await (await getServerSupabase()).auth.getUser();
  if (isAuthSessionMissingError(error)) return null;
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
