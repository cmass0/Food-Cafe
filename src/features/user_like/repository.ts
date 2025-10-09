// src/features/user_like/repository.ts
import { getServerSupabase } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

export async function isLiked(recipeId: string): Promise<boolean> {
  const supabase = await getServerSupabase();
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("user_likes")
    .select("recipe_id", { head: false, count: "exact" })
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .limit(1);

  if (error) throw error;
  return !!(data && data.length > 0);
}

export async function countLikes(recipeId: string): Promise<number> {
  const supabase = await getServerSupabase();
  const { count, error } = await supabase
    .from("user_likes")
    .select("*", { count: "exact", head: true })
    .eq("recipe_id", recipeId);

  if (error) throw error;
  return count ?? 0;
}


export async function likeOnce(recipeId: string): Promise<{ liked: true; count: number }> {
  const supabase = await getServerSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("UNAUTHENTICATED");

  // 이미 눌렀으면 카운트만 반환
  if (await isLiked(recipeId)) {
    const count = await countLikes(recipeId);
    return { liked: true, count };
  }

  // 최초 시도: UNIQUE 충돌은 동시성 no-op로 처리
  const { error: insErr } = await supabase
    .from("user_likes")
    .insert({ user_id: userId, recipe_id: recipeId });

  if (insErr && !String(insErr.message).includes("duplicate")) {
    throw insErr;
  }

  const count = await countLikes(recipeId);
  return { liked: true, count };
}
