import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Comment, CommentCreateDTO, CommentUpdateDTO } from "./types";

const COL = "Comment";

function toDate(t?: Timestamp): Date | null {
  return t?.toDate?.() ?? null;
}

export async function listComments(opts?: {
  limit?: number;
  cursor?: string;
  type?: string;
}): Promise<{ items: Comment[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  let q = adminDb.collection(COL).orderBy("createdAt", "desc").orderBy(FieldPath.documentId());
  if (opts?.type) q = q.where("type", "==", opts.type);

  if (opts?.cursor) {
    const [createdAtMs, id] = Buffer.from(opts.cursor, "base64").toString("utf8").split("|");
    const createdAt = Timestamp.fromMillis(Number(createdAtMs) || 0);
    q = q.startAfter(createdAt, id ?? "");
  }

  const snap = await q.limit(limit).get();
  const items: Comment[] = snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      comment: x.comment ?? "",
      writerName: x.writerName ?? x.writer ?? "",
      writerUid: x.writerUid ?? null,
      type: x.type ?? "",
      createdAt: toDate(x.createdAt) ?? toDate(x.date),
      updatedAt: toDate(x.updatedAt) ?? toDate(x.date),
    };
  });

  const last = snap.docs.at(-1);
  const nextCursor = last
    ? Buffer.from(`${(last.get("createdAt") as Timestamp)?.toMillis?.() ?? 0}|${last.id}`, "utf8").toString("base64")
    : null;

  return { items, nextCursor };
}

export async function getComment(id: string): Promise<Comment | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const x = doc.data() as any;
  return {
    id: doc.id,
    comment: x.comment ?? "",
    writerName: x.writerName ?? x.writer ?? "",
    writerUid: x.writerUid ?? null,
    type: x.type ?? "",
    createdAt: toDate(x.createdAt) ?? toDate(x.date),
    updatedAt: toDate(x.updatedAt) ?? toDate(x.date),
  };
}

export async function createComment(input: CommentCreateDTO): Promise<Comment> {
  const ref = adminDb.collection(COL).doc();
  const data = {
    comment: input.comment,
    writerName: input.writerName,
    writerUid: input.writerUid ?? null,
    type: input.type,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    date: FieldValue.serverTimestamp(),
  };
  await ref.set({ id: ref.id, ...data });
  return (await getComment(ref.id))!;
}

export async function updateComment(id: string, patch: CommentUpdateDTO): Promise<Comment | null> {
  const ref = adminDb.collection(COL).doc(id);
  const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.comment !== undefined) update.comment = patch.comment;
  await ref.update(update);
  return getComment(id);
}

export async function deleteComment(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
