import { readErrorMessage, requestAuthModal } from "@/lib/api/client";

/** 브라우저에서 우리 API를 호출했다가 실패한 이유. */
export type ApiFailureReason = "unauthorized" | "request_failed";

/** 브라우저의 API 호출 실패 오류. HTTP 상태와 실패 이유를 함께 담는다. */
export type ApiError = Error & {
  reason?: ApiFailureReason;
  status?: number;
};

export function isUnauthorizedApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    ((error as ApiError).status === 401 || (error as ApiError).reason === "unauthorized")
  );
}

/** 실패한 API 응답을 ApiError로 바꿔 던진다. 로그인이 필요하면 로그인 모달을 연다. */
export async function throwApiError(res: Response): Promise<never> {
  const message = await readErrorMessage(res);
  const error = new Error(message) as ApiError;
  error.status = res.status;
  error.reason = res.status === 401 ? "unauthorized" : "request_failed";
  if (error.reason === "unauthorized") {
    requestAuthModal();
  }
  throw error;
}
