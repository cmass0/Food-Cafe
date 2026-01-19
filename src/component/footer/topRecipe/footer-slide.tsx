"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import DailyTopRecipe from "./daily-top";
import MonthlyTopRecipe from "./monthly-top";
import WeeklyTopRecipe from "./weekly-top";

export default function RecipeTopFooterSlide() {
  return (
    <section className="rounded-2xl border-1.5 bg-muted/40 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-baseline justify-between gap-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">인기 레시피</h2>
          <span className="text-xs text-muted-foreground">일간 · 주간 · 월간 TOP 10</span>
        </div>
        <Tabs defaultValue="daily" className="w-full">
          <div className="flex justify-between items-center">
            <div>
              <TabsList className="inline-flex rounded-full bg-emerald-50 p-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50">
                <TabsTrigger
                  value="daily"
                  className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900 "
                >
                  일간
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                >
                  주간
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="rounded-full px-4 py-1 data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                >
                  월간
                </TabsTrigger>
              </TabsList>
            </div>

            <p className="text-muted-foreground text-sm">
              <Link href="/ranking">더보기+</Link>
            </p>
          </div>

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
