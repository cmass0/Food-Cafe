// src/app/api/users/route.ts
import { UserCreateSchema } from "@/features/user/types";
import * as repo from "@/features/user/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // P0.5 ??

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    if (username) {
      const user = await repo.findUserByUsername(username);
      return Response.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
    }

    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const data = await repo.listUsers({ limit, cursor });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[users] GET failed", error);
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
  } catch (error) {
    console.error("[users] POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
