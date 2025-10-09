// src/app/api/users/route.ts
import { UserUpdateSchema } from "@/features/user/schema";
import * as repo from "@/features/user/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    if (username) {
      const user = await repo.findUserByUsername(username);
      return Response.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20"), 1), 50);
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
    // 필요한 필드(display_name, photo_url)만 검증
    const payload = UserUpdateSchema.parse(json);
    const created = await repo.createUser(payload);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[users] POST failed", error);
    return Response.json(
      { error: "VALIDATION_OR_INTERNAL_ERROR" },
      { status: 400 }
    );
  }
}
