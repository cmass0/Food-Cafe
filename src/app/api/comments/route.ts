// src/app/api/comments/route.ts
import { CommentCreateSchema } from "@/features/comment/types";
import * as repo from "@/features/comment/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    const data = await repo.listComments({ limit, cursor, type });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[comments] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = CommentCreateSchema.safeParse(json);
    if (!parsed.success)
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    const created = await repo.createComment(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[comments] POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
