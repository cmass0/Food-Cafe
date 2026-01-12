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

export async function GET(_: Request, { params }: contentParams) {
  try {
    const supabase = getServerSupabase();

    const comboId = params.id;
    const combo = await comboService.getComboById(supabase, comboId);
    if (!combo) return notFound();

    return json({ data: combo });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("?덉떆??議고빀??媛?몄삤吏 紐삵뻽?듬땲??", error);
      return respondWithSupabaseError(error);
    }
    console.error("?덉떆??議고빀??媛?몄삤吏 紐삵뻽?듬땲??", error);
    return internalError();
  }
}

export async function PUT(req: Request, { params }: contentParams) {
  let body;
  const supabase = getServerSupabase();
  try {
    try {
      body = await req.json();
    } catch {
      return badRequest("?섎せ??JSON ?뺤떇?낅땲??");
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
      console.error("?덉떆???섏젙???ㅽ뙣?섏??듬땲??", error);
      return respondWithSupabaseError(error);
    }
    console.error("?덉떆???섏젙???ㅽ뙣?섏??듬땲??", error);
    return internalError();
  }
}

export async function DELETE(_: Request, { params }: contentParams) {
  const supabase = getServerSupabase();
  try {
    const combo = await comboService.getComboById(supabase, params.id);
    if (!combo) return notFound();

    await comboService.removeCombo(supabase, params.id);

    return json({ message: "?덉떆??議고빀????젣?섏뿀?듬땲??" }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("?덉떆???섏젙???ㅽ뙣?섏??듬땲??", error);
      return respondWithSupabaseError(error);
    }
    console.error("?덉떆???섏젙???ㅽ뙣?섏??듬땲??", error);
    return internalError();
  }
}

