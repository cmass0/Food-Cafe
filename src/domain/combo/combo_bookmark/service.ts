import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";

export async function buildBookmarkedSetCombo(
  client: SupabaseClient<Database>,
  comboIds: string[]
): Promise<Set<string>> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return new Set<string>();
  }

  return repo.fetchBookmarkedComboIds(client, user.id, comboIds);
}
