import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="overflow-hidden shadow-sm">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <span className="sr-only">페이지를 불러오는 중입니다.</span>
    </main>
  );
}
