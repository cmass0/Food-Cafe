import { getComboById } from "@/domain/combo/service";
import { requireOwnedContent } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import UpdateComboForm from "../components/UpdateComboForm";

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
    <div className="max-w-5xl mx-auto px-6 py-10">
      <UpdateComboForm comboId={combo.id} defaultValues={defaultValues} />
    </div>
  );
}
