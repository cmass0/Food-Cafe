import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { UserCreateInput, UserUpdateLegacyInput } from "./schema";

const COL = "User";

type LegacyUser = {
  id: string;
  email: string;
  username: string;
  likerecipe: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof (value as Timestamp | undefined)?.toDate === "function") {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeLikerecipe(source: unknown): string[] {
  if (!Array.isArray(source)) return [];
  return source.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function mapDocToUser(doc: DocumentSnapshot | QueryDocumentSnapshot): LegacyUser {
  const data = doc.data() as Record<string, unknown> | undefined;
  const createdSource = data?.createdAt ?? data?.date ?? null;
  const updatedSource = data?.updatedAt ?? data?.date ?? null;

  return {
    id: doc.id,
    email: typeof data?.email === "string" ? (data.email as string) : "",
    username: typeof data?.username === "string" ? (data.username as string) : "",
    likerecipe: normalizeLikerecipe(data?.likerecipe),
    createdAt: toDate(createdSource),
    updatedAt: toDate(updatedSource),
  };
}

function millisFromTimestamp(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof (value as Timestamp | undefined)?.toMillis === "function") {
    try {
      return (value as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

export async function listUsers(opts?: {
  limit?: number;
  cursor?: string;
}): Promise<{ items: LegacyUser[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  let q = adminDb.collection(COL).orderBy("createdAt", "desc").orderBy(FieldPath.documentId());

  if (opts?.cursor) {
    const [createdAtMs, id] = Buffer.from(opts.cursor, "base64").toString("utf8").split("|");
    const millis = Number(createdAtMs) || 0;
    const createdAt = Timestamp.fromMillis(millis);
    q = q.startAfter(createdAt, id ?? "");
  }

  const snap = await q.limit(limit).get();
  const items: LegacyUser[] = snap.docs.map((doc) => mapDocToUser(doc));

  const last = snap.docs.at(-1);
  const lastCreated = last?.get("createdAt") ?? last?.get("date");
  const nextCursor = last
    ? Buffer.from(`${millisFromTimestamp(lastCreated)}|${last.id}`, "utf8").toString("base64")
    : null;

  return { items, nextCursor };
}

export async function getUser(id: string): Promise<LegacyUser | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return mapDocToUser(doc);
}

export async function findUserByUsername(username: string): Promise<LegacyUser | null> {
  const snap = await adminDb.collection(COL).where("username", "==", username).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return mapDocToUser(doc);
}

export async function createUser(input: UserCreateInput): Promise<LegacyUser> {
  const ref = input.id ? adminDb.collection(COL).doc(input.id) : adminDb.collection(COL).doc();
  const timestamp = FieldValue.serverTimestamp();
  const likerecipe = normalizeLikerecipe(input.likerecipe);

  await ref.set({
    id: ref.id,
    email: input.email,
    username: input.username,
    likerecipe,
    createdAt: timestamp,
    updatedAt: timestamp,
    date: timestamp,
  });

  return (await getUser(ref.id))!;
}

export async function updateUser(id: string, patch: UserUpdateLegacyInput): Promise<LegacyUser | null> {
  const ref = adminDb.collection(COL).doc(id);
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (patch.username !== undefined) update.username = patch.username;
  if (patch.likerecipe !== undefined) update.likerecipe = normalizeLikerecipe(patch.likerecipe);

  await ref.update(update);
  return getUser(id);
}

export async function deleteUser(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}
