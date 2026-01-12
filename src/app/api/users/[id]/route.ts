import { UserUpdateSchema } from "@/domain/user/schema";
import * as userService from "@/domain/user/service";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const { error: authError } = await AuthErrorHelper(params.id);
    if (authError) return authError;
    const user = await userService.getUserById(params.id);

    return json({ data: user });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("사용자 정보를 가져오는데 실패했습니다.", error);
    return internalError();
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }

    const parsed = UserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.flatten());
    }

    const { error: authError } = await AuthErrorHelper(params.id);
    if (authError) return authError;

    const updated = await userService.updateSelf(parsed.data);
    return json({ data: updated });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }

    console.error("사용자 정보 수정에 실패했습니다.", error);
    return internalError();
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const { error: authError } = await AuthErrorHelper(params.id);
    if (authError) return authError;

    await userService.deleteUserById();
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }

    console.error("사용자 삭제에 실패했습니다.", error);
    return internalError();
  }
}
