import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const BUCKET = "Food-Cafe";

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "-");
  return trimmed.replace(/[\\/]+/g, "-");
}

export function fileExtension(name?: string | null): string {
  if (!name) return "";
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
}

export function randomKey(prefix?: string): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const ts = Date.now();
  return prefix ? `${prefix}-${ts}-${rnd}` : `${ts}-${rnd}`;
}

export function postImagePath(postId: string, filename: string): string {
  return `posts/${postId}/${sanitizeFilename(filename)}`;
}

export function recipeImagePath(recipeId: string, filename: string): string {
  return `recipes/${recipeId}/${sanitizeFilename(filename)}`;
}

export type StorageClient = SupabaseClient<Database>;

// post img
export async function uploadPostImage(
  client: StorageClient,
  postId: string,
  file: File | Blob,
  opts?: { filename?: string; upsert?: boolean; contentType?: string; sign?: number }
): Promise<{ path: string; publicUrl: string | null; signedUrl?: string | null }>
{
  const base = opts?.filename ?? `${randomKey("img")}${fileExtension((file as any)?.name)}`;
  const path = postImagePath(postId, base);
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: Boolean(opts?.upsert),
    contentType: opts?.contentType,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  let signedUrl: string | null | undefined = undefined;
  if (opts?.sign) {
    const res = await client.storage.from(BUCKET).createSignedUrl(path, opts.sign);
    signedUrl = res.data?.signedUrl ?? null;
  }
  return { path, publicUrl: data.publicUrl ?? null, signedUrl };
}

// recipe img
export async function uploadRecipeImage(
  client: StorageClient,
  recipeId: string,
  file: File | Blob,
  opts?: { filename?: string; upsert?: boolean; contentType?: string; sign?: number }
): Promise<{ path: string; publicUrl: string | null; signedUrl?: string | null }>
{
  const base = opts?.filename ?? `${randomKey("img")}${fileExtension((file as any)?.name)}`;
  const path = recipeImagePath(recipeId, base);
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: Boolean(opts?.upsert),
    contentType: opts?.contentType,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  let signedUrl: string | null | undefined = undefined;
  if (opts?.sign) {
    const res = await client.storage.from(BUCKET).createSignedUrl(path, opts.sign);
    signedUrl = res.data?.signedUrl ?? null;
  }
  return { path, publicUrl: data.publicUrl ?? null, signedUrl };
}
