// src/app/api/users/route.ts
import * as userService from "@/domain/user/service";
import {
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
} from "@/lib/api/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    if (username) {
      const user = await userService.findUserByDisplayName(username);
      return json({ data: user });
    }

    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const data = await userService.listUsers({ limit, page });
    return json({ data });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("사용자 목록을 가져오는데 실패했습니다.", error);
    return internalError();
  }
}
