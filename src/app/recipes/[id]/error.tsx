"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type RecipeDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecipeDetailError({ error, reset }: RecipeDetailErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="레시피를 불러오지 못했습니다"
      logContext="recipe-detail"
    />
  );
}
