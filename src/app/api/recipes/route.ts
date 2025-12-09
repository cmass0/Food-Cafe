import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";

import * as recipeService from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

const requestSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  recipe: z.string().nullable().optional(),
  image: z.string().trim().min(1),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof (error as PostgrestError)?.code === "string";

const respondWithSupabaseError = (error: PostgrestError) => {
  const status = error.code === "42501" ? 403 : 400;
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      details: error.details ?? error.hint,
    },
    { status }
  );
};

const serializeUnknownError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ?? null,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (typeof error === "object" && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { message: error.toString() };
    }
  }
  return { message: String(error) };
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;

    const supabase = getServerSupabase();
    const recipes = await recipeService.listRecipes(supabase, {limit, page, writerUid, tag, search});
  
    return NextResponse.json({ data: recipes }, { headers: { "Cache-control": "no-store" } });

  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to get recipe", error);
      return respondWithSupabaseError(error);
    }
    const info = serializeUnknownError(error);
    console.error("Failed to get recipe", info, error);
    return NextResponse.json({ error: "Failed to get recipe", details: info }, { status: 500 });
  }
}


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
      (user.user_metadata)?.name ??
      (user.user_metadata)?.full_name ??
      (user.user_metadata)?.display_name ??
      null;
    const writerEmail = user.email ?? null;

    const recipe = await recipeService.createRecipe(supabase, parsed, {
      uid: user.id,
      name: writerName ?? writerEmail,
      email: writerEmail,
    });
    return NextResponse.json({ data: recipe }, { status: 201 });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to create recipe", error);
      return respondWithSupabaseError(error);
    }
    const info = serializeUnknownError(error);
    console.error("Failed to create recipe", info, error);
    return NextResponse.json({ error: "Failed to create recipe", details: info }, { status: 500 });
  }
}
