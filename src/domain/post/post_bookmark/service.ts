import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import * as repository from "./repository";

export async function isBookmarkedPost(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<boolean> {
  return repository.isBookmarkedPost(client, postId, userId);
}
