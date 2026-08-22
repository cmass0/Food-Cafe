import "server-only";

import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentPermissions = {
  canEdit: boolean;
  canDelete: boolean;
};

// 작성자는 자신의 콘텐츠를 수정·삭제할 수 있고, 관리자는 다른 사용자의 콘텐츠를
// 수정할 수 없지만 삭제할 수 있다. 관리자 여부는 private.user_roles를 확인하는 RPC가 판정한다.
export async function getContentPermissions(
  client: SupabaseClient<Database>,
  userId: string | undefined,
  writerUid: string | null
): Promise<ContentPermissions> {
  if (!userId) return { canEdit: false, canDelete: false };

  const isAuthor = Boolean(writerUid) && userId === writerUid;
  if (isAuthor) return { canEdit: true, canDelete: true };

  const { data: isAdmin, error } = await client.rpc("is_current_user_admin");
  if (error) throw error;

  return { canEdit: false, canDelete: Boolean(isAdmin) };
}
