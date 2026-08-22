"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type RankingErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RankingError({ error, reset }: RankingErrorProps) {
  useEffect(() => {
    console.error("[ranking] 기간별 랭킹 조회 실패", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[420px] w-full max-w-6xl items-center justify-center px-4 py-10">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-100 bg-red-50/60 px-8 py-10 text-center">
        <AlertTriangle className="h-9 w-9 text-red-500" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-zinc-950">랭킹을 불러오지 못했습니다</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <Button type="button" onClick={reset} className="mt-6 gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          다시 시도
        </Button>
      </div>
    </main>
  );
}
