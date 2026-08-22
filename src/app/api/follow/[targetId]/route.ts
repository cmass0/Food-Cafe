import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import * as followService from "@/domain/follow/service";
import { followTargetSchema } from "@/domain/follow/schema";
import { getServerSupabase } from "@/lib/supabase/server";

type FollowParams = { params: Promise<{ targetId: string }> };

export async function GET(_req: Request, props: FollowParams) {
  const params = await props.params;
  const parsedTarget = followTargetSchema.safeParse(params.targetId);
  if (!parsedTarget.success) return badRequest(parsedTarget.error.issues[0]?.message);

  try {
    const { user, error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const supabase = await getServerSupabase();
    const following = await followService.checkIsFollowing(supabase, user.id, parsedTarget.data);
    return json({ following });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("팔로우 상태 조회 실패", error);
    return internalError();
  }
}

export async function POST(_req: Request, props: FollowParams) {
  const params = await props.params;
  const parsedTarget = followTargetSchema.safeParse(params.targetId);
  if (!parsedTarget.success) return badRequest(parsedTarget.error.issues[0]?.message);
  const supabase = await getServerSupabase();

  try {
    const { user, error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    if (user.id === parsedTarget.data) return badRequest("자기 자신은 팔로우할 수 없습니다.");

    const { data, error } = await supabase.rpc("toggle_follow", {
      p_target_id: parsedTarget.data,
    });

    if (error) {
      console.error("팔로우 토글 실패", error);
      return respondWithSupabaseError(error);
    }

    const row = data?.[0];
    if (!row) return notFound("사용자를 찾을 수 없습니다.");

    return json({
      following: row.following,
      followerCount: row.follower_count,
    });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("팔로우 토글 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("팔로우 토글 실패", error);
    return internalError();
  }
}
