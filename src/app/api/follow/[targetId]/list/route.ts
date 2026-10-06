import { followListQuerySchema, followTargetSchema } from "@/domain/follow/schema";
import * as followService from "@/domain/follow/service";
import { badRequest, json, respondWithError, validationError } from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

type FollowListParams = { params: Promise<{ targetId: string }> };

export async function GET(request: Request, props: FollowListParams) {
  const params = await props.params;
  const parsedTarget = followTargetSchema.safeParse(params.targetId);
  if (!parsedTarget.success) return badRequest(parsedTarget.error.issues[0]?.message);

  const url = new URL(request.url);
  const parsedQuery = followListQuerySchema.safeParse({
    type: url.searchParams.get("type"),
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsedQuery.success) return validationError(parsedQuery.error.flatten());

  try {
    const supabase = await getServerSupabase();
    const { type, page, limit } = parsedQuery.data;
    const result =
      type === "followers"
        ? await followService.listFollowers(supabase, parsedTarget.data, { page, limit })
        : await followService.listFollowings(supabase, parsedTarget.data, { page, limit });

    return json({ ...result, type });
  } catch (error) {
    return respondWithError(error, "팔로우 목록 조회 실패", "팔로우 목록을 불러오지 못했습니다.");
  }
}
