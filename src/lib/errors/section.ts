import { unstable_rethrow } from "next/navigation";

import { isPageOutOfRangeError } from "@/lib/errors/supabase";

/**
 * 독립 읽기 영역의 조회 결과. 실패하거나 범위를 벗어나도 data에는 화면이 쓸 대체값이 들어 있다.
 * - error: 조회 장애. 다시 시도 안내를 보여 준다.
 * - outOfRange: 요청한 페이지가 목록 범위를 벗어났다. 장애가 아니므로 첫 페이지 안내를 보여 준다.
 */
export type SectionResult<T> =
  | { data: T; error: false; outOfRange: false }
  | { data: T; error: true; outOfRange: false }
  | { data: T; error: false; outOfRange: true };

/**
 * 독립적인 읽기 영역이 실패해도 페이지의 다른 영역을 계속 렌더링할 수 있게 한다.
 * 인증·권한 확인, 필수 상세 데이터 조회, 생성·수정·삭제에는 사용하지 않는다.
 */
export async function loadSection<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T
): Promise<SectionResult<T>> {
  try {
    return { data: await loader(), error: false, outOfRange: false };
  } catch (error) {
    // redirect/notFound 등 Next.js 제어 흐름은 섹션 조회 실패로 바꾸지 않는다.
    unstable_rethrow(error);
    // 목록이 줄었거나 주소의 page 값이 너무 큰 경우다. 장애 로그를 남기지 않는다.
    if (isPageOutOfRangeError(error)) return { data: fallback, error: false, outOfRange: true };
    console.error(`[section] Failed to load ${label}`, error);
    return { data: fallback, error: true, outOfRange: false };
  }
}
