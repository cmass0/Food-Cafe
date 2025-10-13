// src/app/api/users/[id]/route.ts
// NOTE: 현재는 단순 위임 라우트입니다. 관리자/본인 분기 로직은 추후 필요 시 활성화하세요.
// TODO(admin): 관리자/본인 분기 예시는 아래 주석 블록을 참고해 구현하세요.

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

    /*
    // 관리자/본인 분기 예시 (추후 활성화)
    import { getServerSupabase } from "@/lib/supabase/server";
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const json = await req.json();
    if (user.id === params.id) {
      const updated = await userService.updateSelf(json);
      return Response.json({ data: updated });
    }
    const me = await userService.getSelf();
    if (!me?.is_admin) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const updated = await userService.updateUserById(params.id, json);
    return Response.json({ data: updated });
    */
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
    await userService.deleteUserById();
    return new Response(null, { status: 204 });

    /*
    // 관리자/본인 분기 예시 (추후 활성화)
    import { getServerSupabase } from "@/lib/supabase/server";
    const supabase = getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (user.id === params.id) {
      await userService.deleteUserById(user.id);
      return new Response(null, { status: 204 });
    }
    const me = await userService.getSelf();
    if (!me?.is_admin) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    await userService.deleteUserById(params.id);
    return new Response(null, { status: 204 });
    */
  } catch (error) {
    console.error("[users] [id] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

