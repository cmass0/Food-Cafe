import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(headers || {}) },
  });

const err = (status: number, code: string, message?: string, details?: unknown) =>
  json({ error: code, message, details }, status);

export async function POST(_: Request, { params }: Ctx) {
  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.rpc("increment_recipe_view", { p_recipe_id: params.id });
    if (error) {
      console.error("[recipes][view] increment failed", error);
      return err(500, "INTERNAL_ERROR", "조회수 증가에 실패했습니다.");
    }

    const { data, error: selectError } = await supabase
      .from("recipes")
      .select("view_count")
      .eq("id", params.id)
      .maybeSingle();
    if (selectError) {
      console.error("[recipes][view] select failed", selectError);
      return err(500, "INTERNAL_ERROR", "조회수 증가에 실패했습니다.");
    }

    return json({ viewCount: (data as any)?.view_count ?? null }, 200, {
      "Cache-Control": "no-store",
    });
  } catch (error) {
    console.error("[recipes][view] failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}
