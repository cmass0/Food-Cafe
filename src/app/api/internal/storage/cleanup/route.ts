import { cleanupOrphanedStorage } from "@/lib/storage/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

// Vercel Cron이 매일 호출한다. 30분 이내에 생성된 파일과 DB가 참조하는 파일은 건드리지 않는다.
// STORAGE_CLEANUP_DRY_RUN=1 이면 삭제하지 않고 대상 목록만 반환한다.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ message: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const result = await cleanupOrphanedStorage();
    return Response.json({ data: result });
  } catch (error) {
    console.error("[storage-cleanup] 고아 이미지 정리에 실패했습니다.", error);
    return Response.json({ message: "스토리지 정리에 실패했습니다." }, { status: 500 });
  }
}
