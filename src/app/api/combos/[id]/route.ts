import { ComboUpdateSchema } from "@/domain/combo/schema";
import * as comboService from "@/domain/combo/service";
import * as comboSave from "@/features/combo-save/service";
import { clearTrendingCache } from "@/features/trending/cache";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  badRequest,
  json,
  notFound,
  respondWithError,
  validationError,
} from "@/lib/errors/api-response";
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
    return respondWithError(error, "레시피 조합을 가져오지 못했습니다.");
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

    const { user, error } = await AuthErrorHelper();
    if (error) return error;

    const comboId = params.id;
    const updated = await comboSave.updateCombo(supabase, comboId, user.id, parse.data);
    if (!updated) return notFound("수정할 수 있는 조합");
    return json({ data: updated });
  } catch (error) {
    return respondWithError(error, "레시피 조합 수정에 실패했습니다.");
  }
}

export async function DELETE(_: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();
  try {
    const { error } = await AuthErrorHelper();
    if (error) return error;

    const combo = await comboService.getComboById(supabase, params.id);
    if (!combo) return notFound();

    const deleted = await comboService.removeCombo(supabase, params.id);
    if (!deleted) return notFound("삭제할 수 있는 조합");
    clearTrendingCache();

    return json({ message: "레시피 조합이 삭제되었습니다." }, 200);
  } catch (error) {
    return respondWithError(error, "레시피 조합 삭제에 실패했습니다.");
  }
}
