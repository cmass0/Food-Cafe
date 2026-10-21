// 요청을 보낸 접속 IP를 사용 횟수 제한용 키로 바꾼다. IP를 알 수 없거나 형식이 이상하면 null.
// Vercel은 x-real-ip·x-forwarded-for를 실제 접속 IP로 덮어써서 브라우저가 보낸 값으로 바꿀 수 없다.
// IPv6는 가입자 한 명이 /64 대역을 통째로 받아 주소를 쉽게 바꿀 수 있으므로 앞 64비트만 키로 쓴다.
export function resolveClientIpKey(headers: Headers): string | null {
  const ip = firstValue(headers.get("x-real-ip")) ?? firstValue(headers.get("x-forwarded-for"));
  if (!ip) return null;

  const mappedIpv4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)?.[1];
  if (mappedIpv4) return isIpv4(mappedIpv4) ? mappedIpv4 : null;
  if (isIpv4(ip)) return ip;

  const groups = expandIpv6(ip);
  return groups ? `${groups.slice(0, 4).join(":")}::/64` : null;
}

function firstValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

// "2001:db8::1" 같은 축약형을 0을 채운 소문자 8칸으로 펼친다. IPv6가 아니면 null.
function expandIpv6(value: string): string[] | null {
  const address = value.split("%")[0]!.toLowerCase();
  const halves = address.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;

  const groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => group.padStart(4, "0"));
}
