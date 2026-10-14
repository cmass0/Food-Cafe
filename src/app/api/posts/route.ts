import * as postService from "@/domain/post/service";
import { PostSearchField } from "@/domain/post/types";
import { normalizePostCategory } from "@/domain/post/category";
import { AuthErrorHelper, json, respondWithError } from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;
    const category =
      normalizePostCategory(url.searchParams.get("category")) ??
      normalizePostCategory(url.searchParams.get("type"));
    const search = url.searchParams.get("search") ?? undefined;
    const searchField = (url.searchParams.get("searchField") as PostSearchField) ?? undefined;

    const supabase = await getServerSupabase();
    const posts = await postService.listPosts(supabase, {
      limit,
      page,
      writerUid,
      category,
      search,
      searchField,
    });
    return json({ data: posts });
  } catch (error) {
    return respondWithError(error, "게시글 조회 실패");
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getServerSupabase();
    const { user, error } = await AuthErrorHelper();
    if (error) {
      return error;
    }
    const body = await req.json();
    const created = await postService.createPost(supabase, body, { uid: user.id });
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return respondWithError(error, "게시글 생성 실패");
  }
}
