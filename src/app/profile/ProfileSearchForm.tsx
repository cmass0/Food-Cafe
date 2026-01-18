import { Input } from "@/components/ui/input";

type ProfileSearchFormProps = {
  activeTab: string;
  activeSection?: string;
  search?: string;
  className?: string;
};

export default function ProfileSearchForm({
  activeTab,
  activeSection,
  search,
  className = "w-[30%]",
}: ProfileSearchFormProps) {
  return (
    <form method="get" className={className}>
      <input type="hidden" name="tab" value={activeTab} />
      {activeSection ? <input type="hidden" name="section" value={activeSection} /> : null}
      <Input
        name="search"
        className="rounded-2xl bg-amber-50"
        placeholder="검색: 레시피/태그"
        defaultValue={search ?? ""}
      />
    </form>
  );
}
