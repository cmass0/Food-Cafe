"use client";

import { mapTopRecipe } from "@/domain/recipe/recipe_like/service";
import { TopRecipe } from "@/domain/recipe/recipe_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import TopRecipesCarousel from "./top-recipes-carousel";

export default function WeeklyTopRecipe() {
  const [topRecipes, setToprecipes] = useState<TopRecipe[]>([]);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    async function fetchTopRecipes() {
      try {
        const { data, error } = await supabase.rpc("get_top_recipes_by_recent_likes", {
          term: "week",
          limit_size: 10,
        });
        if (error) {
          throw new Error(`Failed to fetch weekly top recipes: ${error.message}`);
        }
        const recipes = (data ?? []).map((row) => mapTopRecipe(row));
        setToprecipes(recipes);
      } catch (error) {
        console.error("Error fetching weekly top recipes:", error);
      }
    }
    fetchTopRecipes();
  }, []);

  return <TopRecipesCarousel label="주간 인기 레시피" recipes={topRecipes} />;
}
