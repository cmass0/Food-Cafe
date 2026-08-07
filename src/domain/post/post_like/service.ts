import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import * as repository from "./repository";

export async function isLikedPost(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<boolean> {
  return repository.isLikedPost(client, postId, userId);
}
