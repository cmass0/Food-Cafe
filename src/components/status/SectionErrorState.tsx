"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionErrorStateProps } from "./types";

export default function SectionErrorState({
  title,
  description = "잠시 후 다시 시도해 주세요.",
  className,
  compact = false,
  onRetry,
  retrying = false,
}: SectionErrorStateProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  function handleRetry() {
    startTransition(async () => {
      if (onRetry) await onRetry();
      else router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex rounded-lg border border-destructive/20 bg-destructive/5 px-5 text-destructive",
        compact
          ? "flex-col items-stretch gap-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
          : "min-h-[180px] flex-col items-center justify-center py-10 text-center",
        className
      )}
      role="alert"
    >
      <div
        className={cn(
          "flex min-w-0",
          compact ? "items-start gap-3 sm:items-center" : "flex-col items-center"
        )}
      >
        <AlertTriangle
          className={cn("shrink-0", compact ? "size-5" : "mb-3 size-8")}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className={cn("text-sm text-muted-foreground", compact ? "mt-0.5" : "mt-2")}>
            {description}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2", compact ? "w-full sm:w-auto sm:shrink-0" : "mt-5")}
        onClick={handleRetry}
        disabled={isRefreshing || retrying}
      >
        <RotateCcw
          className={cn("size-4", (isRefreshing || retrying) && "animate-spin")}
          aria-hidden="true"
        />
        {isRefreshing || retrying ? "불러오는 중" : "다시 시도"}
      </Button>
    </div>
  );
}
