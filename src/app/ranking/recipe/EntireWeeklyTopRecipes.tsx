"use client";

import { useEffect, useState } from "react";

import { mapTopRecipe } from "@/domain/recipe/recipe_like/service";
import { TopRecipe } from "@/domain/recipe/recipe_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import RankingGrid from "../RankingGrid";

export default function EntireWeeklyTopRecipes() {
  const [topRecipes, setTopRecipes] = useState<TopRecipe[]>([]);

  useEffect(() => {
    async function fetchTopRecipes() {
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase.rpc("get_top_recipes_by_recent_likes", {
          term: "week",
          limit_size: 50,
        });
        if (error) {
          throw new Error(`주간 top50 레시피 랭킹 조회 실패: ${error.message}`);
        }
        const recipes = (data ?? []).map((row) => mapTopRecipe(row));
        setTopRecipes(recipes);
      } catch (error) {
        console.error("주간 top50 레시피 랭킹 조회 실패", error);
      }
    }

    fetchTopRecipes();
  }, []);

  return <RankingGrid items={topRecipes} hrefPrefix="recipes" />;
}
