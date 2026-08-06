// 로그인 이후 이동할 수 없는 경우 사용할 안전한 기본 경로다.
const FALLBACK_PATH = "/";
// 상대 경로를 해석하기 위한 검증 전용 기준 출처다. 실제 서비스 도메인 값으로 사용하지 않는다.
const LOCAL_ORIGIN = "https://foodcafe.local";

// 로그인 후 복귀 경로를 내부 경로로만 제한해 외부 사이트 리다이렉트를 막는다.
export function normalizeReturnTo(value: string | null | undefined, fallback = FALLBACK_PATH) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

// 보호 페이지에서 비로그인 사용자를 홈 로그인 모달로 보낼 때 원래 경로를 쿼리로 전달한다.
export function buildAuthModalPath(next: string) {
  const params = new URLSearchParams({
    auth: "login",
    next: normalizeReturnTo(next),
  });

  return `/?${params.toString()}`;
}
