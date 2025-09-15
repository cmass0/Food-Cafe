// src/app/api/users/route.ts
import { UserCreateSchema } from "@/features/user/types";
import * as repo from "@/features/user/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // P0.5 안정화 동안

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const data = await repo.listUsers({ limit, cursor });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = UserCreateSchema.safeParse(json);
    if (!parsed.success)
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    const created = await repo.createUser(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

