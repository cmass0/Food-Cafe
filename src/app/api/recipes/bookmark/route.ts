import { toggleRecipeBookmark } from "@/domain/user/user_bookmark/service";
import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });

type ToggleBookmarkBody = { recipeId: string; currentlyBookmarked: boolean };

function parseToggleBookmarkBody(value: unknown): ToggleBookmarkBody | null {
  if (!value || typeof value !== "object") return null;
  const anyValue = value as any;
  if (typeof anyValue.recipeId !== "string" || anyValue.recipeId.length === 0) return null;
  if (typeof anyValue.currentlyBookmarked !== "boolean") return null;
  return { recipeId: anyValue.recipeId, currentlyBookmarked: anyValue.currentlyBookmarked };
}


export async function POST(req: Request) {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Failed to get auth user", userError);
    return json({ error: "AUTH_USER_FAILED" }, { status: 500 });
  }
  if (!user) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = parseToggleBookmarkBody(body);

  if (!parsed) {
    return json({ error: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const next = await toggleRecipeBookmark(supabase, {
      userId: user.id,
      recipeId: parsed.recipeId,
      currentlyBookmarked: parsed.currentlyBookmarked,
    });
    return json({ bookmarked: next });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to toggle bookmark", error);
      return respondWithSupabaseError(error);
    }
    console.error("Failed to toggle bookmark", error);
    return json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
