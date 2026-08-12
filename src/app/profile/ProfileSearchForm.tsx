import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type ProfileSearchFormProps = {
  activeTab: string;
  activeSection?: string;
  search?: string;
  sort?: string;
  view?: string;
  className?: string;
};

export default function ProfileSearchForm({
  activeTab,
  activeSection,
  search,
  sort,
  view,
  className,
}: ProfileSearchFormProps) {
  const placeholder = activeSection === "post" ? "게시글 검색..." : "레시피 검색...";

  return (
    <form method="get" className={cn("relative w-full", className)}>
      <input type="hidden" name="tab" value={activeTab} />
      {activeSection ? <input type="hidden" name="section" value={activeSection} /> : null}
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {view ? <input type="hidden" name="view" value={view} /> : null}
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
      <Input
        name="search"
        className="h-12 rounded-lg border-zinc-200 bg-white pl-11 pr-4 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:ring-emerald-600"
        placeholder={placeholder}
        defaultValue={search ?? ""}
      />
    </form>
  );
}
