import { requirePageAuth } from "@/lib/auth/session";
import CreateComboForm from "../components/CreateComboForm";

export default async function NewComboPage() {
  await requirePageAuth("/combos/new");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <CreateComboForm />
    </div>
  );
}
