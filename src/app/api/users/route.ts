// src/app/api/users/route.ts
import * as userService from "@/features/user/service";

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

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20"), 1), 50);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const data = await userService.listUsers({ limit, cursor });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[users] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}


