"use client";

import Skeleton from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Skeleton className="h-7 w-2/3" />
      <div className="space-y-3 rounded-md border border-border bg-card p-4 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-full" />
        ))}
      </div>
    </main>
  );
}
