import { NextResponse } from "next/server";
import { z } from "zod";

import { recipeInsertSchema } from "@/features/recipe/schema";
import * as recipeService from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

const requestSchema = z.object({
  title: z.string(),
  summary: z.string().nullable().optional(),
  recipe: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const supabase = getServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.error("Failed to get auth user", userError);
      return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const writerName =
      (user.user_metadata as any)?.name ??
      (user.user_metadata as any)?.full_name ??
      (user.user_metadata as any)?.display_name ??
      null;
    const writerEmail = user.email ?? null;

    const recipe = await recipeService.createRecipe(supabase, parsed, {
      uid: user.id,
      name: writerName ?? writerEmail,
      email: writerEmail,
    });
    return NextResponse.json({ data: recipe }, { status: 201 });
  } catch (error) {
    console.error("Failed to create recipe", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
