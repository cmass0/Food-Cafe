import type { PostgrestError } from "@supabase/supabase-js";

export const isPostgrestError = (error: unknown): error is PostgrestError =>
  typeof (error as PostgrestError)?.code === "string";

export const respondWithSupabaseError = (error: PostgrestError) => {
  const status = error.code === "42501" ? 403 : 400;
  return Response.json(
    {
      error: error.code,
      message: error.message,
      details: error.details ?? error.hint,
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
};

export const serializeUnknownError = (error: unknown) => {
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
