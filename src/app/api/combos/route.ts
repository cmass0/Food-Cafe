import * as comboService from "@/domain/combo/service";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const supabase = getServerSupabase();
    const limitParams = Number(url.searchParams.get("limit"));
    const pageParams = Number(url.searchParams.get("page"));
    const limit = Number.isFinite(limitParams) ? limitParams : undefined;
    const page = Number.isFinite(pageParams) ? pageParams : undefined;
    const writerUid = url.searchParams.get("writerUid") || undefined;
    const tags = url.searchParams.getAll("tag");
    const search = url.searchParams.get("search") || undefined;

    const combos = await comboService.listCombos(supabase, {
      limit,
      page,
      writerUid,
      tags,
      search,
    });
    return json({ data: combos }, 201);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("조합을 가져오는데 실패했습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("조합을 가져오는데 실패했습니다.", error);
    return internalError();
  }
}

export async function POST(req: Request) {
  let body;
  const supabase = getServerSupabase();
  try {
    body = await req.json();
  } catch {
    return badRequest("잘못된 JSON 형식입니다.");
  }

  const { user, error } = await AuthErrorHelper();
  if (error) return error;

  try {
    const combo = await comboService.createCombo(supabase, {
      ...body,
      writer_uid: user.id,
    });
    return json({ data: combo }, 201);
  } catch (error) {}
}
