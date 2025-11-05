// src/app/api/posts/route.ts
import { getServerSupabase } from "@/lib/supabase/server";
import { postInsertSchema } from "@/features/post/schema";
import * as postService from "@/features/post/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;

    const supabase = getServerSupabase();
    const data = await postService.listPosts(supabase, {
      limit,
      page,
      writerUid,
      type,
      search,
    });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[posts] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = postInsertSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const created = await postService.createPost(supabase, parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[posts] POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
