import { getComboById } from "@/domain/combo/service";
import { requireOwnedContent } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import UpdateComboForm from "../components/UpdateComboForm";
import { FormPageHeader } from "@/components/forms/FormSection";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";

export default async function ComboEditPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams?.id;
  if (!id) notFound();

  const next = `/combos/edit?id=${encodeURIComponent(id)}`;
  const combo = await requireOwnedContent(next, (supabase) => getComboById(supabase, id));

  const defaultValues = {
    title: combo.title,
    summary: combo.summary || "",
    difficulty: combo.difficulty || "",
    time_minutes: combo.timeMinutes || 0,
    tags: combo.tags,
    tools: combo.tools,
    items: combo.items || [],
    steps: combo.steps || [],
    image: combo.image || null,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <FormPageHeader
        title="조합 수정"
        description="바꿀 부분만 고친 뒤 아래의 수정 버튼을 눌러 주세요."
      />
      <WritingAssistantWorkspace kind="combo">
        <UpdateComboForm comboId={combo.id} defaultValues={defaultValues} />
      </WritingAssistantWorkspace>
    </div>
  );
}
