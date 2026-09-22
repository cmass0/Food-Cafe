import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecommendResultCard } from "./RecommendResultCard";
import type { RecommendSidebarProps, RecommendSidebarTab } from "./types";

const TABS: Array<{ value: RecommendSidebarTab; label: string }> = [
  { value: "personalized", label: "맞춤 추천" },
  { value: "popular", label: "인기 메뉴" },
];

export function RecommendSidebar({ activeTab, items, onTabChange }: RecommendSidebarProps) {
  return (
    <aside className="rounded-2xl bg-zinc-50 p-5" aria-label="추천 둘러보기">
      <h2 className="text-xl font-black tracking-tight text-zinc-950">추천 둘러보기</h2>
      <div className="mt-4 grid grid-cols-2 rounded-xl bg-zinc-100 p-1" role="tablist">
        {TABS.map((tab) => {
          const active = tab.value === activeTab;
          return (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "rounded-lg text-sm",
                active && "bg-white font-bold text-[#34783f] shadow-sm hover:bg-white"
              )}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <RecommendResultCard key={`${item.sourceType}-${item.id}`} item={item} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
            추천 데이터가 여기에 표시됩니다.
          </p>
        )}
      </div>
    </aside>
  );
}
