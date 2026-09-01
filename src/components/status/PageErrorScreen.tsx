"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageErrorScreenProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  logContext: string;
};

export default function PageErrorScreen({
  error,
  reset,
  title,
  logContext,
}: PageErrorScreenProps) {
  useEffect(() => {
    console.error(`[${logContext}] 페이지 렌더링 실패`, error);
  }, [error, logContext]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center shadow-sm" role="alert">
        <CardHeader className="items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="pt-3 text-xl">{title}</CardTitle>
          <CardDescription className="leading-6">
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={reset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
