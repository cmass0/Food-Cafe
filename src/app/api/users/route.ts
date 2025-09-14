// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import * as repo from "@/features/user/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // P0.5 안정화 동안

export async function GET() {
  try {
    const data = await repo.listUsers();
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await repo.createUser({
      email: String(body?.email ?? ""),
      username: String(body?.username ?? ""),
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

