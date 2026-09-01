"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="ko">
      <body>
        <PageErrorScreen
          error={error}
          reset={reset}
          title="사이트를 불러오지 못했습니다"
          logContext="global"
        />
      </body>
    </html>
  );
}
