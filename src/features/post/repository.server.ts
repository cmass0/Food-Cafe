import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Post, PostCreateDTO, PostUpdateDTO } from "./types";

const COL = "Post";
const ORDER_FIELD = "createdAt";

function toDate(t?: Timestamp): Date | null {
  return t?.toDate?.() ?? null;
}

function encodeCursor(value: number): string {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function decodeCursor(cursor: string): number {
  const raw = Number(Buffer.from(cursor, "base64").toString("utf8"));
  return Number.isFinite(raw) ? raw : 0;
}

export async function listPosts(opts?: {
  limit?: number;
  cursor?: string;
  writerUid?: string;
  type?: string;
}): Promise<{ items: Post[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  let q = adminDb.collection(COL).orderBy(ORDER_FIELD, "desc");

  if (opts?.writerUid) q = q.where("writerUid", "==", opts.writerUid);
  if (opts?.type) q = q.where("type", "==", opts.type);

  if (opts?.cursor) {
    const cursorMs = decodeCursor(opts.cursor);
    q = q.startAfter(Timestamp.fromMillis(cursorMs));
  }

  const snap = await q.limit(limit).get();
  const items: Post[] = snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      title: x.title ?? "",
      content: x.content ?? "",
      writerName: x.writerName ?? x.writer ?? "",
      writerUid: x.writerUid ?? null,
      number: Number(x.number ?? 0),
      check: Number(x.check ?? 0),
      type: x.type ?? "board",
      createdAt: toDate(x.createdAt) ?? toDate(x.date),
      updatedAt: toDate(x.updatedAt) ?? toDate(x.date),
    };
  });

  const last = snap.docs.at(-1);
  const lastTimestamp = (last?.get(ORDER_FIELD) as Timestamp | undefined)?.toMillis?.() ?? null;
  const nextCursor = lastTimestamp ? encodeCursor(lastTimestamp) : null;

  return { items, nextCursor };
}

export async function getPost(id: string): Promise<Post | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const x = doc.data() as any;
  return {
    id: doc.id,
    title: x.title ?? "",
    content: x.content ?? "",
    writerName: x.writerName ?? x.writer ?? "",
    writerUid: x.writerUid ?? null,
    number: Number(x.number ?? 0),
    check: Number(x.check ?? 0),
    type: x.type ?? "board",
    createdAt: toDate(x.createdAt) ?? toDate(x.date),
    updatedAt: toDate(x.updatedAt) ?? toDate(x.date),
  };
}

export async function createPost(input: PostCreateDTO): Promise<Post> {
  const col = adminDb.collection(COL);
  const ref = col.doc();
  const countSnap = await col.count().get?.().catch(async () => {
    const snap = await col.get();
    return { data: () => ({ count: snap.size }) } as any;
  });
  const total = countSnap?.data?.().count ?? 0;

  const data = {
    title: input.title,
    content: input.content,
    writerName: input.writerName,
    writerUid: input.writerUid ?? null,
    number: total + 1,
    check: 0,
    type: input.type ?? "board",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    // backward compat with legacy code that reads 'date'
    date: FieldValue.serverTimestamp(),
  };
  await ref.set({ id: ref.id, ...data });
  return (await getPost(ref.id))!;
}

export async function updatePost(id: string, patch: PostUpdateDTO): Promise<Post | null> {
  const ref = adminDb.collection(COL).doc(id);
  const update: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.writerName !== undefined) update.writerName = patch.writerName;
  if (patch.writerUid !== undefined) update.writerUid = patch.writerUid;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.checkIncrement) update.check = FieldValue.increment(1);

  await ref.update(update);
  return getPost(id);
}

export async function deletePost(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
