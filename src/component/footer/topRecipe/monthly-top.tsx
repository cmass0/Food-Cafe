"use client";

import { useEffect, useState } from "react";

import { mapTopRecipe } from "@/domain/recipe/recipe_like/service";
import { TopRecipe } from "@/domain/recipe/recipe_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import TopCarousel from "../top-recipes-carousel";

export default function MonthlyTopRecipe() {
  const [topRecipes, setTopRecipes] = useState<TopRecipe[]>([]);

  useEffect(() => {
    async function fetchTopRecipes() {
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase.rpc("get_top_recipes_by_recent_likes", {
          term: "month",
          limit_size: 10,
        });
        if (error) {
          throw new Error(`레시피 조회 실패: ${error.message}`);
        }

        const recipes = (data ?? []).map((row) => mapTopRecipe(row));
        setTopRecipes(recipes);
      } catch (error) {
        console.error("월간 인기 레시피 조회 실패:", error);
      }
    }

    fetchTopRecipes();
  }, []);

  return <TopCarousel label="월간 인기 레시피" contents={topRecipes} />;
}
