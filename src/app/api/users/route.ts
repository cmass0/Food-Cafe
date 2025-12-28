// src/app/api/users/route.ts
import * as userService from "@/domain/user/service";
import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    if (username) {
      const user = await userService.findUserByDisplayName(username);
      return Response.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
    }

    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const data = await userService.listUsers({ limit, page });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("[users] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
