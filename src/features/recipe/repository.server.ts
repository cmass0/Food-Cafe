import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Recipe, RecipeCreateDTO, RecipeUpdateDTO } from "./types";

const COL = "Recipe";

function toDate(t?: Timestamp): Date | null {
  return t?.toDate?.() ?? null;
}

export async function listRecipes(opts?: {
  limit?: number;
  cursor?: string; // base64 encoded
  writerUid?: string;
}): Promise<{ items: Recipe[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);

  let q = adminDb
    .collection(COL)
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId());

  if (opts?.writerUid) {
    q = q.where("writerUid", "==", opts.writerUid);
  }

  if (opts?.cursor) {
    const [createdAtMs, id] = Buffer.from(opts.cursor, "base64").toString("utf8").split("|");
    const createdAt = new Date(Number(createdAtMs));
    q = q.startAfter(createdAt, id);
  }

  const snap = await q.limit(limit).get();

  const items: Recipe[] = snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      title: x.title ?? "",
      summary: x.summary ?? null,
      image: x.image ?? null,
      recipe: x.recipe ?? "",
      writerUid: x.writerUid ?? "",
      writerName: x.writerName ?? "",
      likeCount: Number(x.likeCount ?? 0),
      createdAt: toDate(x.createdAt),
      updatedAt: toDate(x.updatedAt),
    };
  });

  const last = snap.docs.at(-1);
  const nextCursor = last
    ? Buffer.from(`${(last.get("createdAt") as Timestamp)?.toMillis?.() ?? 0}|${last.id}`, "utf8").toString("base64")
    : null;

  return { items, nextCursor };
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const x = doc.data() as any;
  return {
    id: doc.id,
    title: x.title ?? "",
    summary: x.summary ?? null,
    image: x.image ?? null,
    recipe: x.recipe ?? "",
    writerUid: x.writerUid ?? "",
    writerName: x.writerName ?? "",
    likeCount: Number(x.likeCount ?? 0),
    createdAt: toDate(x.createdAt),
    updatedAt: toDate(x.updatedAt),
  };
}

export async function createRecipe(input: RecipeCreateDTO): Promise<Recipe> {
  const ref = adminDb.collection(COL).doc();
  await ref.set({
    ...input,
    likeCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return (await getRecipe(ref.id))!;
}

export async function updateRecipe(id: string, patch: RecipeUpdateDTO): Promise<Recipe | null> {
  const ref = adminDb.collection(COL).doc(id);
  await ref.update({
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return getRecipe(id);
}

export async function deleteRecipe(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}

