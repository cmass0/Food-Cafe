// src/app/api/users/[id]/route.ts
// Current implementation enforces a self-only policy. Extend with role checks when needed.

import { getServerSupabase } from "@/lib/supabase/server";
import { ZodError } from "zod";
import * as userService from "@/features/user/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const supabase = getServerSupabase();

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[users] [id] GET auth failed", authError);
      return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    }

    if (!authUser) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (authUser.id !== params.id) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const user = await userService.getUserById(params.id);
    if (!user) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json(
      { data: user },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[users] [id] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const supabase = getServerSupabase();

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[users] [id] DELETE auth failed", authError);
      return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    }

    if (!authUser) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (authUser.id !== params.id) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    await userService.deleteUserById();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[users] [id] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    const updated = await userService.updateSelf(payload);
    return Response.json({ data: updated });
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
      if (code === "VALIDATION_ERROR") {
        return Response.json(
          { error: "VALIDATION_ERROR", message: error.message },
          { status: 400 }
        );
      }
    }
    console.error("[users] [id] PUT failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
