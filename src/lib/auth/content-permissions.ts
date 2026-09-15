import "server-only";

import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentPermissions = {
  canEdit: boolean;
  canDelete: boolean;
};

/** 인증·DB 연결과 분리된 콘텐츠 소유권 정책을 계산한다. */
export function resolveContentPermissions(
  userId: string | undefined,
  writerUid: string | null,
  isAdmin: boolean
): ContentPermissions {
  if (!userId) return { canEdit: false, canDelete: false };
  if (writerUid === userId) return { canEdit: true, canDelete: true };
  return { canEdit: false, canDelete: isAdmin };
}

// 작성자는 자신의 콘텐츠를 수정·삭제할 수 있고, 관리자는 다른 사용자의 콘텐츠를
// 수정할 수 없지만 삭제할 수 있다. 관리자 여부는 private.user_roles를 확인하는 RPC가 판정한다.
export async function getContentPermissions(
  client: SupabaseClient<Database>,
  userId: string | undefined,
  writerUid: string | null
): Promise<ContentPermissions> {
  if (!userId) return resolveContentPermissions(userId, writerUid, false);

  const isAuthor = Boolean(writerUid) && userId === writerUid;
  if (isAuthor) return resolveContentPermissions(userId, writerUid, false);

  const { data: isAdmin, error } = await client.rpc("is_current_user_admin");
  if (error) throw error;

  return resolveContentPermissions(userId, writerUid, Boolean(isAdmin));
}
