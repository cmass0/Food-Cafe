/**
 * Firestore schema standardization migration (User / Recipe / Post / Comment)
 * - Set DRY_RUN=1 to preview without writes
 * - Set DELETE_LEGACY=1 to remove deprecated fields after migration
 *
 * Examples:
 *   # Preview
 *   DRY_RUN=1 ts-node tools/migrations/migrate.ts
 *   # Apply changes
 *   ts-node tools/migrations/migrate.ts
 */

import 'dotenv/config';
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  Firestore,
  DocumentSnapshot,
} from "firebase-admin/firestore";

/* --------------------------- ENV & Admin --------------------------- */

const DRY_RUN = process.env.DRY_RUN === "1";
const DELETE_LEGACY = process.env.DELETE_LEGACY === "1";

function req(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: req("FIREBASE_PROJECT_ID"),
      clientEmail: req("FIREBASE_CLIENT_EMAIL"),
      privateKey: req("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

/* --------------------------- Utils --------------------------- */

const now = () => FieldValue.serverTimestamp();

function asTimestamp(v: any): Timestamp | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v;
  if (typeof v === "object" && typeof v.toDate === "function") return v as Timestamp;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

async function applyPatch(
  snap: DocumentSnapshot,
  patch: Record<string, any>,
  label: string
) {
  if (!Object.keys(patch).length) return false;

  if (DRY_RUN) {
    console.log(`[DRY] ${label} ${snap.ref.path} ->`, patch);
    return true;
  }

  await snap.ref.update(patch);
  return true;
}

function toStringArray(a: any): string[] | undefined {
  if (!a) return undefined;
  if (Array.isArray(a)) return a.map((item) => String(item));
  return [String(a)];
}

function normalizeKey(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.toLowerCase();
}

type NameIndex = Map<string, Set<string>>;

interface UserIndex {
  emailToUid: Map<string, string>;
  nameToUid: NameIndex;
}

function addToNameIndex(index: NameIndex, value: string | undefined, uid: string) {
  const key = normalizeKey(value);
  if (!key) return;
  const bucket = index.get(key);
  if (bucket) {
    bucket.add(uid);
    return;
  }
  index.set(key, new Set<string>([uid]));
}

function findUidByName(index: NameIndex, value: string | undefined): string | undefined {
  const key = normalizeKey(value);
  if (!key) return undefined;
  const bucket = index.get(key);
  if (!bucket || bucket.size !== 1) return undefined;
  const iterator = bucket.values().next();
  return iterator.done ? undefined : iterator.value;
}

async function buildUserIndex(db: Firestore): Promise<UserIndex> {
  const emailToUid = new Map<string, string>();
  const nameToUid: NameIndex = new Map();
  const snap = await db.collection("User").get();

  snap.forEach((doc) => {
    const data = doc.data() as any;
    const uid = doc.id;

    const email = typeof data.email === "string" ? data.email.toLowerCase() : undefined;
    if (email) emailToUid.set(email, uid);

    addToNameIndex(nameToUid, data.displayName, uid);
    addToNameIndex(nameToUid, data.username, uid);
  });

  const ambiguous: string[] = [];
  nameToUid.forEach((set, key) => {
    if (set.size > 1) ambiguous.push(key);
  });
  if (ambiguous.length) {
    console.warn(
      `User name duplicates detected (writerUid mapping may be skipped): ${ambiguous.join(", ")}`
    );
  }

  return { emailToUid, nameToUid };
}

/* --------------------------- Migrators --------------------------- */

async function migrateUsers() {
  console.log("==> Migrating User ...");
  const snap = await db.collection("User").get();
  let patched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    const patch: Record<string, any> = {};

    if (!data.createdAt) patch.createdAt = asTimestamp(data.date) ?? now();
    if (!data.updatedAt) patch.updatedAt = now();
    if (!data.displayName && data.username) patch.displayName = String(data.username);
    if (!data.uid) patch.uid = doc.id;
    if (!data.role) patch.role = "user";
    if (!data.likedRecipeIds && data.likerecipe) {
      const arr = toStringArray(data.likerecipe);
      if (arr) patch.likedRecipeIds = arr;
    }

    if (DELETE_LEGACY) {
      if ("id" in data) patch.id = FieldValue.delete();
      if ("date" in data) patch.date = FieldValue.delete();
      if ("username" in data) patch.username = FieldValue.delete();
      if ("likerecipe" in data) patch.likerecipe = FieldValue.delete();
    }

    if (await applyPatch(doc, patch, "User")) patched++;
  }

  console.log(`User patched: ${patched}`);
}

async function migrateRecipes(userIndex: UserIndex) {
  console.log("==> Migrating Recipe ...");
  const snap = await db.collection("Recipe").get();
  let patched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    const patch: Record<string, any> = {};

    if (!data.createdAt) patch.createdAt = asTimestamp(data.date) ?? now();
    if (!data.updatedAt) patch.updatedAt = now();

    if (!data.content && data.recipe) patch.content = String(data.recipe);

    if (!data.writerName && data.name) patch.writerName = String(data.name);

    if (!data.category && data.type) patch.category = String(data.type);

    if (!data.images && data.image) {
      const arr = toStringArray(data.image);
      if (arr) patch.images = arr;
    }

    if (typeof data.likeCount !== "number") {
      const n = Number(data.like);
      patch.likeCount = Number.isFinite(n) ? n : 0;
    }

    if (data.lastlike && !data.lastLikedAt) {
      const ts = asTimestamp(data.lastlike);
      if (ts) patch.lastLikedAt = ts;
    }

    if (!data.writerUid) {
      let uid: string | undefined;
      if (data.email) {
        uid = userIndex.emailToUid.get(String(data.email).toLowerCase());
      }
      if (!uid) {
        const candidate = String(data.writerName ?? data.name ?? "");
        uid = findUidByName(userIndex.nameToUid, candidate);
      }
      if (uid) patch.writerUid = uid;
    }

    if (typeof data.status === "undefined" && typeof data.check !== "undefined") {
      const n = Number(data.check);
      patch.status = Number.isFinite(n) ? n : 0;
    }

    if (DELETE_LEGACY) {
      if ("id" in data) patch.id = FieldValue.delete();
      if ("date" in data) patch.date = FieldValue.delete();
      if ("recipe" in data) patch.recipe = FieldValue.delete();
      if ("name" in data) patch.name = FieldValue.delete();
      if ("type" in data) patch.type = FieldValue.delete();
      if ("like" in data) patch.like = FieldValue.delete();
      if ("lastlike" in data) patch.lastlike = FieldValue.delete();
      if ("image" in data) patch.image = FieldValue.delete();
      if ("check" in data) patch.check = FieldValue.delete();
      if ("email" in data) patch.email = FieldValue.delete();
    }

    if (await applyPatch(doc, patch, "Recipe")) patched++;
  }

  console.log(`Recipe patched: ${patched}`);
}

async function migratePosts(userIndex: UserIndex) {
  console.log("==> Migrating Post ...");
  const snap = await db.collection("Post").get();
  let patched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    const patch: Record<string, any> = {};

    if (!data.createdAt) patch.createdAt = asTimestamp(data.date) ?? now();
    if (!data.updatedAt) patch.updatedAt = now();

    if (!data.writerName && data.writer) patch.writerName = String(data.writer);

    if (!data.category && data.type) patch.category = String(data.type);

    if (typeof data.likeCount !== "number") {
      const n = Number(data.likeCount ?? data.like);
      patch.likeCount = Number.isFinite(n) ? n : 0;
    }

    if (typeof data.commentCount !== "number") {
      const n = Number(data.commentCount);
      patch.commentCount = Number.isFinite(n) ? n : 0;
    }

    if (!data.writerUid) {
      const candidate = String(data.writerName ?? data.writer ?? "");
      const uid = findUidByName(userIndex.nameToUid, candidate);
      if (uid) patch.writerUid = uid;
    }

    if (typeof data.status === "undefined" && typeof data.check !== "undefined") {
      const n = Number(data.check);
      patch.status = Number.isFinite(n) ? n : 0;
    }

    if (DELETE_LEGACY) {
      if ("id" in data) patch.id = FieldValue.delete();
      if ("date" in data) patch.date = FieldValue.delete();
      if ("writer" in data) patch.writer = FieldValue.delete();
      if ("type" in data) patch.type = FieldValue.delete();
      if ("number" in data) patch.number = FieldValue.delete();
      if ("check" in data) patch.check = FieldValue.delete();
    }

    if (await applyPatch(doc, patch, "Post")) patched++;
  }

  console.log(`Post patched: ${patched}`);
}

async function migrateComments(userIndex: UserIndex) {
  console.log("==> Migrating Comment ...");
  const snap = await db.collection("Comment").get();
  let patched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    const patch: Record<string, any> = {};

    if (!data.createdAt) patch.createdAt = asTimestamp(data.date) ?? now();
    if (!data.updatedAt) patch.updatedAt = now();

    if (!data.body && data.comment) patch.body = String(data.comment);

    if (!data.postId && data.type) patch.postId = String(data.type);

    if (!data.writerName && data.writer) patch.writerName = String(data.writer);

    if (!data.writerUid) {
      const candidate = String(data.writerName ?? data.writer ?? "");
      const uid = findUidByName(userIndex.nameToUid, candidate);
      if (uid) patch.writerUid = uid;
    }

    if (DELETE_LEGACY) {
      if ("id" in data) patch.id = FieldValue.delete();
      if ("date" in data) patch.date = FieldValue.delete();
      if ("comment" in data) patch.comment = FieldValue.delete();
      if ("type" in data) patch.type = FieldValue.delete();
      if ("writer" in data) patch.writer = FieldValue.delete();
    }

    if (await applyPatch(doc, patch, "Comment")) patched++;
  }

  console.log(`Comment patched: ${patched}`);
}

/* --------------------------- Main --------------------------- */

async function main() {
  console.log(
    `DRY_RUN=${DRY_RUN ? "1" : "0"}  DELETE_LEGACY=${DELETE_LEGACY ? "1" : "0"}`
  );

  const userIndex = await buildUserIndex(db);

  await migrateUsers();
  await migrateRecipes(userIndex);
  await migratePosts(userIndex);
  await migrateComments(userIndex);

  console.log("Migration finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});







