import { getComboById } from "@/domain/combo/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import UpdateComboForm from "../components/UpdateComboForm";

export default async function ComboEditPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams?.id;
  if (!id) notFound();

  const supabase = getServerSupabase();
  const combo = await getComboById(supabase, id);
  if (!combo) {
    notFound();
  }
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
