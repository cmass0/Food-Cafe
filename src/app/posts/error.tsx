"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type PostsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PostsError({ error, reset }: PostsErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="게시글 목록을 불러오지 못했습니다"
      logContext="posts"
    />
  );
}
