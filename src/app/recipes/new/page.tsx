import CreateRecipeForm from "../_components/CreateRecipeForm";

export default function NewRecipePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">레시피 등록</h1>
        <p className="text-sm text-foreground/70">
          새로운 레시피를 작성하고 저장하면 자동으로 상세 페이지로 이동합니다.
        </p>
      </header>
      <CreateRecipeForm />
    </main>
  );
}
