import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { User, UserCreateDTO, UserUpdateDTO } from "./types";

const COL = "User";

function toDate(t?: Timestamp): Date | null {
  return t?.toDate?.() ?? null;
}

export async function listUsers(opts?: { limit?: number; cursor?: string }): Promise<{ items: User[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  let q = adminDb.collection(COL).orderBy("createdAt", "desc").orderBy(FieldPath.documentId());
  if (opts?.cursor) {
    const [createdAtMs, id] = Buffer.from(opts.cursor, "base64").toString("utf8").split("|");
    const createdAt = new Date(Number(createdAtMs));
    q = q.startAfter(createdAt, id);
  }

  const snap = await q.limit(limit).get();
  const items: User[] = snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      email: x.email ?? "",
      username: x.username ?? "",
      likerecipe: Number(x.likerecipe ?? 0),
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

export async function getUser(id: string): Promise<User | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const x = doc.data() as any;
  return {
    id: doc.id,
    email: x.email ?? "",
    username: x.username ?? "",
    likerecipe: Number(x.likerecipe ?? 0),
    createdAt: toDate(x.createdAt) ?? toDate(x.date),
    updatedAt: toDate(x.updatedAt) ?? toDate(x.date),
  };
}

export async function createUser(input: UserCreateDTO): Promise<User> {
  const ref = adminDb.collection(COL).doc();
  const data = {
    email: input.email,
    username: input.username,
    likerecipe: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    date: FieldValue.serverTimestamp(),
  };
  await ref.set({ id: ref.id, ...data });
  return (await getUser(ref.id))!;
}

export async function updateUser(id: string, patch: UserUpdateDTO): Promise<User | null> {
  const ref = adminDb.collection(COL).doc(id);
  const update: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.username !== undefined) update.username = patch.username;
  await ref.update(update);
  return getUser(id);
}

export async function deleteUser(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}

