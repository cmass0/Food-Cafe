"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type RecipeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecipeError({ error, reset }: RecipeErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="레시피 목록을 불러오지 못했습니다"
      logContext="recipes"
    />
  );
}
