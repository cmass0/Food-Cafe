// src/app/api/posts/route.ts
import { PostCreateSchema } from "@/features/post/types";
import * as repo from "@/features/post/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    const data = await repo.listPosts({ limit, cursor, writerUid, type });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to list posts", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PostCreateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const created = await repo.createPost(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create post", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
