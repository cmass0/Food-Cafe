import { requirePageAuth } from "@/lib/auth/session";
import CreateComboForm from "../components/CreateComboForm";
import { FormPageHeader } from "@/components/forms/FormSection";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";

export default async function NewComboPage() {
  await requirePageAuth("/combos/new");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <FormPageHeader
        title="조합 등록"
        description="사이트 레시피와 상품을 골라 나만의 한 끼 조합을 만들어 보세요."
      />
      <WritingAssistantWorkspace kind="combo">
        <CreateComboForm />
      </WritingAssistantWorkspace>
    </div>
  );
}
