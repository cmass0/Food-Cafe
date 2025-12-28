import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(headers || {}) },
  });

const err = (status: number, code: string, message?: string, details?: unknown) =>
  json({ error: code, message, details }, status);

export async function POST(_: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) {
      return err(400, "BAD_REQUEST", "?좏슚?섏? ?딆? 寃뚯떆湲 ID?낅땲??");
    }

    const supabase = getServerSupabase();
    const { error } = await supabase.rpc("increment_post_view", { target: params.id });
    if (error) {
      if (isPostgrestError(error)) {
        return respondWithSupabaseError(error);
      }
      console.error("[posts][view] increment failed", error);
      return err(500, "INTERNAL_ERROR", "議고쉶??利앷????ㅽ뙣?덉뒿?덈떎.");
    }

    const { data, error: selectError } = await supabase
      .from("posts")
      .select("view_count")
      .eq("id", params.id)
      .maybeSingle();
    if (selectError) {
      if (isPostgrestError(selectError)) {
        return respondWithSupabaseError(selectError);
      }
      console.error("[posts][view] select failed", selectError);
      return err(500, "INTERNAL_ERROR", "議고쉶??利앷????ㅽ뙣?덉뒿?덈떎.");
    }

    return json({ viewCount: (data as any)?.view_count ?? null }, 200, {
      "Cache-Control": "no-store",
    });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("[posts][view] failed", error);
    return err(500, "INTERNAL_ERROR", "?쒕쾭 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
  }
}
