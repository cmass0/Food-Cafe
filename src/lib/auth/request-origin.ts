// 인증 콜백이 되돌려 보낼 출처를 정한다.
// 개발 서버는 `--hostname 127.0.0.1`로 떠도 req.url의 host를 localhost로 바꿔 알려 준다.
// 그 주소로 보내면 127.0.0.1에 저장된 세션 쿠키가 따라가지 않으므로, 개발 환경에서는 브라우저가 실제로 요청한 host를 쓴다.
// host·x-forwarded-host는 클라이언트가 보낼 수 있는 값이라, 프록시 구성에 따라 임의 출처로의 이동에 쓰일 수 있다.
// 그래서 운영(trustHostHeaders=false)에서는 헤더를 보지 않고 req.url의 출처만 쓴다.
export function resolveRequestOrigin(
  requestUrl: string,
  headers: Headers,
  { trustHostHeaders }: { trustHostHeaders: boolean }
): string {
  const fallback = new URL(requestUrl).origin;
  if (!trustHostHeaders) return fallback;

  const host = firstValue(headers.get("x-forwarded-host") ?? headers.get("host"));
  if (!host) return fallback;

  const protocol = firstValue(headers.get("x-forwarded-proto")) ?? new URL(requestUrl).protocol;
  const scheme = protocol.replace(/:$/, "");
  if (scheme !== "http" && scheme !== "https") return fallback;

  try {
    const origin = new URL(`${scheme}://${host}`);
    // 경로·계정 정보가 섞인 비정상 host 값은 쓰지 않는다.
    return origin.host === host.toLowerCase() ? origin.origin : fallback;
  } catch {
    return fallback;
  }
}

function firstValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}
