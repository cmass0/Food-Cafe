export type SearchSectionResult<T> = { data: T; error: false } | { data: T; error: true };

type ErrorWithCode = {
  code?: unknown;
};

export function isEmptySearchPageError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as ErrorWithCode).code === "PGRST103";
}

export async function loadSearchSection<T>(
  label: string,
  loader: () => Promise<T>,
  emptyResult: T
): Promise<SearchSectionResult<T>> {
  try {
    return { data: await loader(), error: false };
  } catch (error) {
    // 요청한 페이지 범위에 행이 없다는 뜻이므로 장애가 아니라 빈 검색 결과로 취급한다.
    if (isEmptySearchPageError(error)) {
      return { data: emptyResult, error: false };
    }

    console.error(`[search] Failed to load ${label}`, error);
    return { data: emptyResult, error: true };
  }
}
