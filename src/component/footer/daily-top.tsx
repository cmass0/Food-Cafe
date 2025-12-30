"use client";

import { useEffect, useState } from "react";

import { mapTopRecipe, TopRecipe, TopRecipeRow } from "@/domain/recipe/recipe_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import TopRecipesCarousel from "./top-recipes-carousel";

export default function DailyTopRecipe() {
  const [topRecipes, setTopRecipes] = useState<TopRecipe[]>([]);

  useEffect(() => {
    async function fetchTopRecipes() {
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase.rpc("get_top_recipes_by_recent_likes", {
          term: "day",
          limit_size: 10,
        });
        if (error) {
          throw new Error(`Failed to fetch daily top recipes: ${error.message}`);
        }
        const recipes = (data ?? []).map((row) => mapTopRecipe(row as TopRecipeRow));
        setTopRecipes(recipes);
      } catch (error) {
        console.error("Error fetching daily top recipes:", error);
      }
    }

    fetchTopRecipes();
  }, []);

  return <TopRecipesCarousel label="오늘 인기 레시피" recipes={topRecipes} />;
}
