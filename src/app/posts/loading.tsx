"use client";

import Skeleton from "@/components/ui/skeleton";

export default function PostsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-md border border-border bg-card p-4 shadow-sm"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}

