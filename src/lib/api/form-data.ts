/** 한 번의 요청에서 정리 대상으로 받아들일 업로드 경로의 최대 개수. */
export const MAX_UPLOADED_PATHS = 50;

/**
 * 폼에 담겨 온 업로드 경로 목록을 읽는다.
 * 값이 없거나 형식이 깨졌으면 실패시키지 않고 빈 배열로 처리한다.
 * 업로드 정리는 보조 작업이라 이 값 때문에 본 요청이 중단되면 안 된다.
 */
export function uploadedPathsFromFormData(
  formData: FormData,
  field = "uploaded_paths"
): string[] {
  const raw = formData.get(field);
  if (typeof raw !== "string" || !raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((path): path is string => typeof path === "string")
      .slice(0, MAX_UPLOADED_PATHS);
  } catch {
    return [];
  }
}
