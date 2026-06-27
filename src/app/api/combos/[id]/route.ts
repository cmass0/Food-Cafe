import { ComboUpdateSchema } from "@/domain/combo/schema";
import * as comboService from "@/domain/combo/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  badRequest,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();

    const comboId = params.id;
    const combo = await comboService.getComboById(supabase, comboId);
    if (!combo) return notFound();

    return json({ data: combo });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합을 가져오지 못했습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합을 가져오지 못했습니다.", error);
    return internalError();
  }
}

export async function PUT(req: Request, props: contentParams) {
  const params = await props.params;
  let body;
  const supabase = await getServerSupabase();
  try {
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }
    const parse = ComboUpdateSchema.safeParse(body);
    if (!parse.success) {
      return validationError(parse.error);
    }

    const comboId = params.id;
    const updated = await comboService.updateCombo(supabase, comboId, parse.data);
    return json({ data: updated });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 수정에 실패했습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 수정에 실패했습니다.", error);
    return internalError();
  }
}

export async function DELETE(_: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();
  try {
    const combo = await comboService.getComboById(supabase, params.id);
    if (!combo) return notFound();

    await comboService.removeCombo(supabase, params.id);

    return json({ message: "레시피 조합이 삭제되었습니다." }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 삭제에 실패했습니다.", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 삭제에 실패했습니다.", error);
    return internalError();
  }
}
