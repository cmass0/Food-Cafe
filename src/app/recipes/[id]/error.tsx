"use client";

type RecipeDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecipeDetailError({ error, reset }: RecipeDetailErrorProps) {
  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <h2 className="text-2xl font-semibold">레시피를 불러오는 중 문제가 발생했습니다.</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "잠시 후 다시 시도해주세요."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        다시 시도
      </button>
    </main>
  );
}
