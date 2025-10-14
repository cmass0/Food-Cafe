// src/app/api/users/route.ts
import { ZodError } from "zod";

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

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const created = await userService.createSelf(payload);
    return Response.json(
      { data: created },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return Response.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (error instanceof Error) {
      const code = (error as { code?: string }).code;
      if (code === "UNAUTHORIZED") {
        return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      if (code === "USER_ALREADY_EXISTS") {
        return Response.json({ error: "CONFLICT", message: error.message }, { status: 409 });
      }
      if (code === "VALIDATION_ERROR") {
        return Response.json(
          { error: "VALIDATION_ERROR", message: error.message },
          { status: 400 }
        );
      }
    }
    console.error("[users] POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
