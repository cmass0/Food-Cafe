import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ProfileView } from "./profile-types";

type Props = {
  view?: ProfileView;
};

// 프로필 목록 카드 자리를 미리 그려, 탭·검색·페이지를 바꾼 직후에도 화면이 멈춰 보이지 않게 한다.
export default function ProfileListSkeleton({ view = "grid" }: Props) {
  const isList = view === "list";

  return (
    <div aria-busy="true" aria-live="polite">
      <div className={cn("grid gap-4", isList ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3")}>
        {Array.from({ length: 6 }, (_, index) => (
          <Card
            key={index}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          >
            <CardContent
              className={cn(
                "grid gap-4 p-3",
                isList
                  ? "grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[190px_minmax(0,1fr)]"
                  : "grid-cols-[128px_minmax(0,1fr)]"
              )}
            >
              <Skeleton className={cn("rounded-lg", isList ? "h-36 sm:h-40" : "h-36")} />
              <div className="space-y-3 py-1">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mt-5 h-4 w-2/5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">목록을 불러오는 중입니다.</span>
    </div>
  );
}
