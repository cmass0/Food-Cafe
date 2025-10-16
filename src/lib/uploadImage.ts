"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";

// Upload a file to Supabase Storage and return a public URL (or signed URL fallback).
// Bucket: "images" (ensure it exists and is public or adjust signed URL logic below).
export default async function uploadImage(file: File | Blob | null): Promise<string | null> {
  if (!file) return null;

  const supabase = getBrowserSupabase();
  const bucket = "images";
  const ext = inferExt(file) ?? "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    console.error("Supabase upload failed", uploadError);
    return null;
  }

  // Try public URL first
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  if (publicData?.publicUrl) return publicData.publicUrl;

  // Fallback to a short-lived signed URL if bucket is private
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (signedError) {
    console.error("Failed to create signed URL", signedError);
    return null;
  }
  return signedData?.signedUrl ?? null;
}

function inferExt(file: File | Blob): string | null {
  // Prefer File.type when available
  const type = (file as File).type || "";
  if (!type) return null;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return map[type] ?? null;
}
