import { requirePageAuth } from "@/lib/auth/session";
import CreateComboForm from "../components/CreateComboForm";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";

export default async function NewComboPage() {
  await requirePageAuth("/combos/new");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <WritingAssistantWorkspace kind="combo">
        <CreateComboForm />
      </WritingAssistantWorkspace>
    </div>
  );
}
