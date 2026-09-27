import "server-only";

import { isAuthSessionMissingError } from "@/lib/errors/supabase";
import { buildAuthModalPath } from "@/lib/auth/return-to";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";

type AuthContext = {
  supabase: SupabaseClient<Database>;
  user: User;
};

async function getAuthContextOrNull(): Promise<AuthContext | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (isAuthSessionMissingError(error)) return null;
  if (error) throw error;
  return data.user ? { supabase, user: data.user } : null;
}

export async function getUserOrNull() {
  return (await getAuthContextOrNull())?.user ?? null;
}

export async function requireAuth() {
  return (await requireAuthContext()).user;
}

export async function requireAuthContext(): Promise<AuthContext> {
  const auth = await getAuthContextOrNull();
  if (!auth) {
    throw new Error("로그인이 필요합니다.");
  }
  return auth;
}

export async function requirePageAuth(next: string): Promise<AuthContext> {
  const auth = await getAuthContextOrNull();
  if (!auth) redirect(buildAuthModalPath(next));
  return auth;
}

export async function requireOwnedContent<T extends { writerUid: string | null }>(
  next: string,
  loadContent: (supabase: SupabaseClient<Database>) => Promise<T | null>
): Promise<T> {
  const { supabase, user } = await requirePageAuth(next);
  const content = await loadContent(supabase);

  if (!content || content.writerUid !== user.id) {
    notFound();
  }

  return content;
}
