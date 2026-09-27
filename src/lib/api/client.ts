import type { ApiError, ApiFailureReason } from "@/lib/errors/api-client";

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: ApiFailureReason;
      message: string;
      status: number;
    };

export const AUTH_REQUIRED_EVENT = "food-cafe:auth-required";

type AuthRequiredEventDetail = {
  next?: string;
};

function currentNextPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search || ""}`;
}

export function requestAuthModal(next = currentNextPath()): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthRequiredEventDetail>(AUTH_REQUIRED_EVENT, {
      detail: { next },
    })
  );
}

export async function readErrorMessage(res: Response): Promise<string> {
  let message = res.statusText || `Request failed: ${res.status}`;

  try {
    const data = await res.json();
    message =
      data?.details?.message ||
      data?.details?.hint ||
      data?.details ||
      data?.message ||
      data?.error ||
      message;
  } catch {
    // Keep the default message when the response is not JSON.
  }

  return message;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, init);

  if (!res.ok) {
    return {
      ok: false,
      reason: res.status === 401 ? "unauthorized" : "request_failed",
      message: await readErrorMessage(res),
      status: res.status,
    };
  }

  return {
    ok: true,
    data: (await res.json()) as T,
  };
}

export async function fetchJsonData<T>(url: string, init?: RequestInit): Promise<T> {
  const result = await fetchJson<T>(url, init);
  if (!result.ok) {
    const error = new Error(result.message) as ApiError;
    error.reason = result.reason;
    error.status = result.status;
    throw error;
  }
  return result.data;
}
