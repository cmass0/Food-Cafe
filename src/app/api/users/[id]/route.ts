// src/app/api/users/[id]/route.ts
import * as userService from "@/features/user/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const user = await userService.getUserById(params.id);
    if (!user) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[users] [id] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const updated = await userService.updateUserById(params.id, json);
    return Response.json({ data: updated });
  } catch (error) {
    console.error("[users] [id] PUT failed", error);
    return Response.json(
      { error: "VALIDATION_OR_INTERNAL_ERROR" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await userService.deleteUserById(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[users] [id] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
