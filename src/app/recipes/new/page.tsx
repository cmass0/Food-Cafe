import CreateRecipeForm from "../components/CreateRecipeForm";

export default function NewRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">레시피 등록</h1>
        <p className="text-sm text-foreground/70">
          새 레시피를 작성하고 대표 이미지를 올려 주세요. 핵심 재료와 단계를 빠르게 정리하면 검색과
          공유가 더 잘 됩니다.
        </p>
      </header>
      <CreateRecipeForm />
    </main>
  );
}
