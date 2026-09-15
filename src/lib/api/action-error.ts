import { ZodError } from "zod";

/** 원인을 특정할 수 없을 때 사용자에게 보여줄 기본 문구. */
export const DEFAULT_ACTION_ERROR =
  "요청 처리 과정에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

const DEFAULT_INPUT_ERROR = "입력 내용을 확인해 주세요.";

/**
 * 서버 액션에서 발생한 오류를 사용자에게 보여줄 문구로 바꾼다.
 * 허용 목록에 없는 오류는 내부 정보가 새지 않도록 기본 문구로 대체한다.
 */
export function toActionErrorMessage(error: unknown, userFacing: ReadonlySet<string>): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? DEFAULT_INPUT_ERROR;
  }
  if (error instanceof Error && userFacing.has(error.message)) {
    return error.message;
  }
  return DEFAULT_ACTION_ERROR;
}
