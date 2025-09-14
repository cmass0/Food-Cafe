// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import * as repo from "@/features/user/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const user = await repo.getUser(params.id);
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ data: user }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const updated = await repo.updateUser(params.id, {
      username: body?.username ?? undefined,
    });
    if (!updated) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  await repo.deleteUser(params.id);
  return NextResponse.json(null, { status: 204 });
}

