import { mentionCandidateQuerySchema } from "@/domain/follow/schema";
import * as followService from "@/domain/follow/service";
import { json, respondWithError, validationError } from "@/lib/errors/api-response";
import { isAuthSessionMissingError } from "@/lib/errors/supabase";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsedQuery = mentionCandidateQuerySchema.safeParse({
    q: url.searchParams.get("q"),
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsedQuery.success) return validationError(parsedQuery.error.flatten());

  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (isAuthSessionMissingError(error)) {
      return json({ error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401);
    }
    if (error) throw error;
    if (!user) {
      return json({ error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401);
    }

    const { q, page, limit } = parsedQuery.data;
    const result = await followService.searchMentionCandidates(supabase, user.id, q, {
      page,
      limit,
    });
    return json(result);
  } catch (error) {
    return respondWithError(error, "멘션 후보 조회 실패", "멘션 후보를 불러오지 못했습니다.");
  }
}
