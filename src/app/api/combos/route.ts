import * as comboService from "@/domain/combo/service";
import { ComboSearchField, ComboSort } from "@/domain/combo/types";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  json,
  respondWithSupabaseError,
  validationError,
} from "@/lib/errors/api-response";
import { isPostgrestError } from "@/lib/errors/supabase";
import { getServerSupabase } from "@/lib/supabase/server";
import { ZodError } from "zod";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const supabase = await getServerSupabase();
    const limitParams = Number(url.searchParams.get("limit"));
    const pageParams = Number(url.searchParams.get("page"));
    const limit = Number.isFinite(limitParams) ? limitParams : undefined;
    const page = Number.isFinite(pageParams) ? pageParams : undefined;
    const writerUid = url.searchParams.get("writerUid") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const searchField = (url.searchParams.get("searchField") as ComboSearchField) || undefined;
    const sortParam = url.searchParams.get("sort");
    const sort =
      sortParam === "recent" || sortParam === "like" || sortParam === "view"
        ? (sortParam as ComboSort)
        : undefined;

    const combos = await comboService.listCombos(supabase, {
      limit,
      page,
      writerUid,
      search,
      searchField,
      sort,
    });
    return json({ data: combos });
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
  const supabase = await getServerSupabase();
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
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }

    if (error instanceof ZodError) {
      console.error("레시피 생성 실패 - zod검증 오류", error);
      return validationError(error.errors);
    }
    console.error("조합 생성에 실패했습니다.", error);
    return internalError();
  }
}
