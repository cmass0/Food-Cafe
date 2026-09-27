"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";

import PageOutOfRange from "./PageOutOfRange";
import SectionErrorState from "./SectionErrorState";
import type { SectionProps } from "./types";

/**
 * 모든 독립 읽기 영역의 공통 틀. 조회 실패(failed)면 다시 시도 안내, 범위 밖 page(outOfRange)면
 * 첫 페이지 안내, 그 외에는 children을 보여 주고 렌더링 오류를 이 영역 안에 가둔다.
 * 서버 조회 자체는 loadSection에서 처리하며, 결과의 error·outOfRange를 그대로 넘기면 된다.
 */
export default function Section({
  name,
  failed = false,
  title,
  description,
  compact,
  errorClassName,
  recoveryContent,
  resetKeys = [],
  onRetry,
  outOfRange = false,
  pageParam,
  children,
}: SectionProps) {
  const router = useRouter();
  const boundary = useRef<ErrorBoundary>(null);
  const retryCompleted = useRef(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // refresh 결과가 반영되기 전에 초기화하면 이전 데이터로 다시 실패할 수 있다.
    if (!isPending && retryCompleted.current) {
      retryCompleted.current = false;
      boundary.current?.resetErrorBoundary();
    }
  }, [isPending]);

  function retry() {
    startTransition(async () => {
      try {
        if (onRetry) await onRetry();
        else router.refresh();
        retryCompleted.current = true;
      } catch (error) {
        unstable_rethrow(error);
        console.error(`[section] Failed to retry ${name}`, error);
      }
    });
  }

  const fallback = (
    <>
      <SectionErrorState
        title={title}
        description={description}
        compact={compact}
        className={errorClassName}
        onRetry={retry}
        retrying={isPending}
      />
      {recoveryContent}
    </>
  );

  return (
    <ErrorBoundary
      ref={boundary}
      resetKeys={[name, failed, outOfRange, ...resetKeys]}
      onError={(error, info) => {
        unstable_rethrow(error);
        console.error(`[section] Failed to render ${name}`, error, info.componentStack);
      }}
      fallback={fallback}
    >
      {failed ? (
        fallback
      ) : outOfRange ? (
        <PageOutOfRange pageParam={pageParam} compact={compact} className={errorClassName} />
      ) : (
        children
      )}
    </ErrorBoundary>
  );
}
