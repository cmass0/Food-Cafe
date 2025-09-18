import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Recipe, RecipeCreateDTO, RecipeUpdateDTO } from "./types";

const COL = "Recipe";

function toMaybeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as Timestamp | undefined)?.toDate === "function") {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function extractImage(data: Record<string, unknown> | undefined): string | null {
  const direct = data?.image;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const images = (data as any)?.images;
  if (Array.isArray(images)) {
    const first = images.find((item) => typeof item === "string" && item.length > 0);
    if (typeof first === "string") return first;
  }

  return null;
}

function mapDocToRecipe(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Recipe {
  const data = doc.data() as Record<string, unknown> | undefined;
  const likeSource = data?.likeCount ?? data?.like ?? 0;
  const viewSource = data?.viewCount ?? data?.check ?? 0;
  const lastLiked = data?.lastLikedAt ?? data?.lastlike ?? null;
  const createdSource = data?.createdAt ?? data?.date ?? null;
  const updatedSource = data?.updatedAt ?? data?.date ?? null;

  const rawWriterUid = data?.writerUid ?? (data as any)?.writeruid ?? null;
  const writerUid = typeof rawWriterUid === "string" && rawWriterUid.length > 0 ? rawWriterUid : null;

  const rawWriterName = (data?.writerName ?? (data as any)?.name) as string | undefined;

  return {
    id: doc.id,
    title: (data?.title as string) ?? "",
    summary: (data?.summary as string | null | undefined) ?? null,
    image: extractImage(data),
    recipe: (data?.recipe as string) ?? ((data as any)?.content as string) ?? "",
    writerUid,
    writerName: rawWriterName ?? "",
    writerEmail: (data?.writerEmail as string | null | undefined) ?? ((data as any)?.email ?? null),
    likeCount: Number(likeSource) || 0,
    viewCount: Number(viewSource) || 0,
    lastLikedAt: toMaybeDate(lastLiked),
    createdAt: toMaybeDate(createdSource),
    updatedAt: toMaybeDate(updatedSource),
  };
}

export async function listRecipes(opts?: {
  limit?: number;
  cursor?: string; // base64 encoded doc id (legacy format supported)
  writerUid?: string;
}): Promise<{ items: Recipe[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);

  let q = adminDb.collection(COL).orderBy("createdAt", "desc");

  if (opts?.writerUid) {
    q = q.where("writerUid", "==", opts.writerUid);
  }

  if (opts?.cursor) {
    const decoded = Buffer.from(opts.cursor, "base64").toString("utf8");
    const parts = decoded.split("|");
    const cursorId = parts.length > 1 ? parts[1] : decoded;
    if (cursorId) {
      const snapshot = await adminDb.collection(COL).doc(cursorId).get();
      if (snapshot.exists) {
        q = q.startAfter(snapshot);
      }
    }
  }

  const snap = await q.limit(limit).get();

  const items = snap.docs.map((doc) => mapDocToRecipe(doc));

  const last = snap.docs.at(-1);
  const nextCursor = last
    ? Buffer.from(last.id, "utf8").toString("base64")
    : null;

  return { items, nextCursor };
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return mapDocToRecipe(doc);
}

export async function createRecipe(input: RecipeCreateDTO): Promise<Recipe> {
  const ref = adminDb.collection(COL).doc();
  const timestamp = FieldValue.serverTimestamp();
  await ref.set({
    id: ref.id,
    title: input.title,
    summary: input.summary ?? null,
    image: input.image ?? null,
    recipe: input.recipe,
    writerUid: input.writerUid ?? null,
    writerName: input.writerName,
    writerEmail: input.writerEmail ?? null,
    likeCount: 0,
    viewCount: 0,
    lastLikedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    date: timestamp, // backward compatibility
  });
  return (await getRecipe(ref.id))!;
}

export async function updateRecipe(id: string, patch: RecipeUpdateDTO): Promise<Recipe | null> {
  const ref = adminDb.collection(COL).doc(id);
  const update: Record<string, unknown> = {};

  if (patch.title !== undefined) update.title = patch.title;
  if (patch.summary !== undefined) update.summary = patch.summary ?? null;
  if (patch.image !== undefined) update.image = patch.image ?? null;
  if (patch.recipe !== undefined) update.recipe = patch.recipe;
  if (patch.writerUid !== undefined) update.writerUid = patch.writerUid ?? null;
  if (patch.writerName !== undefined) update.writerName = patch.writerName;
  if (patch.writerEmail !== undefined) update.writerEmail = patch.writerEmail ?? null;

  if (patch.likeCount !== undefined) update.likeCount = patch.likeCount;
  if (patch.viewCount !== undefined) update.viewCount = patch.viewCount;

  if (patch.likeCountIncrement) update.likeCount = FieldValue.increment(1);
  if (patch.viewCountIncrement) update.viewCount = FieldValue.increment(1);

  if (patch.lastLikedAt !== undefined) {
    update.lastLikedAt = patch.lastLikedAt ? new Date(patch.lastLikedAt) : null;
  }

  update.updatedAt = FieldValue.serverTimestamp();

  await ref.update(update);
  return getRecipe(id);
}

export async function deleteRecipe(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}

