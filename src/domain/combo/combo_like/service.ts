import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as combolikeRepo from "./repository";

export async function buildLikedSetCombo(
  client: SupabaseClient<Database>,
  comboIds: string[]
): Promise<Set<string>> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");
  return combolikeRepo.fetchLikedCombos(client, user.id, comboIds);
}
