// src/app/api/users/[id]/route.ts
import { UserUpdateSchema } from "@/features/user/types";
import * as repo from "@/features/user/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const user = await repo.getUser(params.id);
  if (!user) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = UserUpdateSchema.safeParse(json);
    if (!parsed.success)
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    const updated = await repo.updateUser(params.id, parsed.data);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: updated });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  await repo.deleteUser(params.id);
  return Response.json(null, { status: 204 });
}

