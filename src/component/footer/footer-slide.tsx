"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTopRecipe from "./daily-top";
import WeeklyTopRecipe from "./weekly-top";
import MonthlyTopRecipe from "./monthly-top";

export default function FooterSlide() {
  return (
    <section className="rounded-2xl border-1.5 bg-muted/40 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">인기 레시피</h2>
          <span className="text-xs text-muted-foreground">오늘 · 이번 주 · 이번 달 TOP 10</span>
        </div>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="mb-4 inline-flex rounded-full bg-emerald-50 p-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50">
            <TabsTrigger
              value="daily"
              className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900"
            >
              오늘
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900"
            >
              이번 주
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900"
            >
              이번 달
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">
            <DailyTopRecipe />
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            <WeeklyTopRecipe />
          </TabsContent>
          <TabsContent value="month" className="mt-0">
            <MonthlyTopRecipe />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
