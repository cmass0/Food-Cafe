// src/app/api/recipes/[id]/route.ts
import { recipeUpdateSchema } from "@/domain/recipe/schema";
import * as service from "@/domain/recipe/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: contentParams) {
  try {
    const supabase = getServerSupabase();
    const item = await service.getRecipeById(supabase, params.id);
    if (!item) return notFound("해당 레시피를 찾을 수 없습니다.");

    return json({ data: item });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피를 가져오지 못했습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피를 가져오지 못했습니다.", error);
    return internalError();
  }
}

export async function PUT(req: Request, { params }: contentParams) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }

    const parsed = recipeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { error } = await AuthErrorHelper();
    if (error) return error;

    const supabase = getServerSupabase();
    const updated = await service.updateRecipe(supabase, params.id, parsed.data);
    return json({ data: updated });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 수정에 실패하였습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 수정에 실패하였습니다.", error);
    return internalError();
  }
}

export async function DELETE(_: Request, { params }: contentParams) {
  const supabase = getServerSupabase();
  try {
    const existing = await service.getRecipeById(supabase, params.id);
    if (!existing) return notFound("레시피를 찾을 수 없습니다.");

    await service.removeRecipe(supabase, params.id);

    return json({ message: "레시피가 삭제되었습니다." }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 삭제에 실패하였습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 삭제에 실패하였습니다.", error);
    return internalError();
  }
}
