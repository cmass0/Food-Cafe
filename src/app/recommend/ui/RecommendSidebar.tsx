import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendResultCard } from "./RecommendResultCard";
import type { RecommendSidebarProps, RecommendSidebarTab } from "./types";

const TABS: Array<{ value: RecommendSidebarTab; label: string }> = [
  { value: "personalized", label: "맞춤 추천" },
  { value: "popular", label: "인기 메뉴" },
];

export function RecommendSidebar({
  activeTab,
  items,
  onTabChange,
  isLoading = false,
  error = false,
}: RecommendSidebarProps) {
  return (
    <aside className="rounded-2xl bg-zinc-50 p-5" aria-label="추천 둘러보기">
      <h2 className="text-xl font-black tracking-tight text-zinc-950">추천 둘러보기</h2>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "personalized" || value === "popular") onTabChange(value);
        }}
        className="mt-4"
      >
        <TabsList
          className="grid h-auto w-full grid-cols-2 rounded-xl bg-zinc-100 p-1"
          aria-label="추천 유형"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg py-2 text-sm data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-[#34783f] data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-5 space-y-3">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-zinc-500" role="status">
                인기 추천을 불러오는 중이에요…
              </p>
            ) : error ? (
              <p
                className="rounded-xl border border-dashed border-red-200 px-4 py-6 text-center text-sm text-red-700"
                role="alert"
              >
                인기 추천을 불러오지 못했어요.
              </p>
            ) : items.length > 0 ? (
              items.map((item, index) => (
                <div key={`${item.sourceType}-${item.id}`} className="flex items-start gap-3">
                  {tab.value === "popular" ? (
                    <span className="w-5 pt-4 text-center text-sm font-bold text-zinc-700">
                      {index + 1}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <RecommendResultCard item={item} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
                {tab.value === "popular"
                  ? "최근 30일간 추천된 메뉴가 아직 없어요."
                  : "추천 데이터가 여기에 표시됩니다."}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </aside>
  );
}
