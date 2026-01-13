import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntireDailyTopCombos from "./combo/EntireDailyTopCombos";
import EntireMonthlyTopCombos from "./combo/EntireMonthlyTopCombos";
import EntireWeeklyTopCombos from "./combo/EntireWeeklyTopCombos";
import EntireDailyTopRecipes from "./recipe/EntireDailyTopRecipes";
import EntireMonthlyTopRecipes from "./recipe/EntireMonthlyTopRecipes";
import EntireWeeklyTopRecipes from "./recipe/EntireWeeklyTopRecipes";

export default function RankingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">TOP 50</h1>
        <p className="text-sm text-muted-foreground">일간 / 주간 / 월간 인기 목록입니다.</p>
      </header>

      <Tabs defaultValue="recipe" className="w-full">
        <div className="flex items-center justify-center">
          <TabsList className="mb-4">
            <TabsTrigger value="recipe">레시피</TabsTrigger>
            <TabsTrigger value="combo">레시피 조합</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="recipe">
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="daily">일간</TabsTrigger>
              <TabsTrigger value="weekly">주간</TabsTrigger>
              <TabsTrigger value="monthly">월간</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <EntireDailyTopRecipes />
            </TabsContent>
            <TabsContent value="weekly">
              <EntireWeeklyTopRecipes />
            </TabsContent>
            <TabsContent value="monthly">
              <EntireMonthlyTopRecipes />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="combo">
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="daily">일간</TabsTrigger>
              <TabsTrigger value="weekly">주간</TabsTrigger>
              <TabsTrigger value="monthly">월간</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <EntireDailyTopCombos />
            </TabsContent>
            <TabsContent value="weekly">
              <EntireWeeklyTopCombos />
            </TabsContent>
            <TabsContent value="monthly">
              <EntireMonthlyTopCombos />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </main>
  );
}
