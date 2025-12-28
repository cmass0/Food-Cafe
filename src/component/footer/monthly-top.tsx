"use client";

import { useEffect, useState } from "react";

import { mapTopRecipe, TopRecipe, TopRecipeRow } from "@/domain/user/user_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import TopRecipesCarousel from "./top-recipes-carousel";

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
          throw new Error(`Failed to fetch monthly top recipes: ${error.message}`);
        }
        const recipes = (data ?? []).map((row) => mapTopRecipe(row as TopRecipeRow));
        setTopRecipes(recipes);
      } catch (error) {
        console.error("Error fetching monthly top recipes:", error);
      }
    }

    fetchTopRecipes();
  }, []);

  return <TopRecipesCarousel label="월간 인기 레시피" recipes={topRecipes} />;
}
