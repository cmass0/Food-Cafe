import { requirePageAuth } from "@/lib/auth/session";
import CreateRecipeForm from "../components/CreateRecipeForm";
import { FormPageHeader } from "@/components/forms/FormSection";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";

export default async function NewRecipePage() {
  await requirePageAuth("/recipes/new");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <FormPageHeader
        title="레시피 등록"
        description="차례대로 채우면 레시피가 완성돼요. 작성 도우미와 대화하며 초안을 만들 수도 있어요."
      />
      <WritingAssistantWorkspace kind="recipe">
        <CreateRecipeForm />
      </WritingAssistantWorkspace>
    </main>
  );
}
