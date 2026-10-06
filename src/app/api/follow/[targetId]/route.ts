import {
  AuthErrorHelper,
  badRequest,
  json,
  notFound,
  respondWithError,
} from "@/lib/errors/api-response";
import { readRelationState } from "@/lib/api/relation-state";
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
    return respondWithError(error, "팔로우 상태 조회 실패");
  }
}

export async function POST(req: Request, props: FollowParams) {
  const params = await props.params;
  const parsedTarget = followTargetSchema.safeParse(params.targetId);
  if (!parsedTarget.success) return badRequest(parsedTarget.error.issues[0]?.message);

  try {
    const { user, error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    if (user.id === parsedTarget.data) return badRequest("자기 자신은 팔로우할 수 없습니다.");

    const following = await readRelationState(req, "following");
    if (following === null) return badRequest("following 값이 필요합니다.");

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("set_follow", { p_target_id: parsedTarget.data, p_following: following })
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound("사용자");

    return json({ following: data.following, followerCount: data.follower_count });
  } catch (error) {
    return respondWithError(error, "팔로우 처리 실패");
  }
}
