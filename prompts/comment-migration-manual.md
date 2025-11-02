> **UPDATED 2025-xx:** Repository now standardises on offset/page pagination. This document is archived for historical cursor-based guidance - follow prompts/migration-cursor-to-offset-verified.md for current steps.

# Comment ?닿? & 由щ돱??留ㅻ돱??(Supabase 湲곗?)
_?묒꽦?? 2025-10-27 18:53 KST_

蹂?臾몄꽌??**Firebase 湲곕컲 Comment 湲곕뒫**??**Supabase(Postgres + RLS)** 諛⑹떇?쇰줈 ?꾨㈃ ?닿??섍린 ?꾪븳 ?④퀎蹂?媛?대뱶?낅땲??  
?대? Supabase ?꾪솚???꾨즺??`post`, `recipe`, `user` ?꾨찓?몄쓽 ?ㅺ퀎瑜?洹몃?濡?**?ъ궗???뺣젹**?⑸땲??

> **???由ы룷吏?좊━**: `Food-Cafe-refactor-ts-architecture`  
> **???곹깭(諛쒓껄???뚯씪)**  
> - API(Route Handlers):  
>   - `src/app/api/comments/route.ts`  
>   - `src/app/api/comments/[id]/route.ts`  
> - Feature/Repository(?뚯씠?대쿋?댁뒪):  
>   - `src/features/comment/repository.server.ts` (Firebase Admin ?ъ슜)  
> - Feature/Types(???ㅽ궎留?:  
>   - `src/features/comment/types.ts` (Zod + ?≪? ?꾨뱶紐? `comment`, `writerName`, `type` ??  
> - API Client(Fetch wrapper):  
>   - `src/features/comment/api.ts`

---

## 0) 紐⑺몴 ?꾪궎?띿쿂
- `features/post`? ?숈씪??**Supabase ?꾨찓???덉씠??4醫?*?쇰줈 ?듭씪
  - `types.ts` ??DB Row/Insert/Update ????뺤쓽 (`Database` ???湲곕컲)
  - `schema.ts` ??Zod ?ㅽ궎留?(?낅젰 寃利?
  - `repository.ts` ??**Supabase Query 鍮뚮뜑濡?CRUD** (+ 而ㅼ꽌 ?섏씠吏?ㅼ씠?? ?꾪꽣)
  - `service.ts` ??鍮꾩쫰?덉뒪 洹쒖튃/沅뚰븳 泥댄겕(?꾩슂 ??
- **Route Handlers**??Firebase ?섏〈 ?쒓굅 ??`features/comment/repository.ts` ?몄텧濡?援먯껜
- **UI 而댄룷?뚰듃**??湲곗〈 props瑜??좎??섎릺, ??API shape??留욎떠 理쒖냼 ?섏젙

---

## 1) Supabase ?뚯씠釉??뺤쓽 ?ъ젏寃
?붿껌?먭? ?쒓났???꾩옱 ?ㅽ궎留??붿빟):

```sql
create table public.comments (
  id uuid not null default gen_random_uuid(),
  parent_type public.comment_parent_type not null,
  parent_id uuid not null,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint comments_pkey primary key (id),
  constraint comments_author_id_fkey foreign key (author_id) references users (id) on delete set null
);

create index if not exists idx_comments_parent_created_at
  on public.comments using btree (parent_type, parent_id, created_at);

create index if not exists idx_comments_author_id
  on public.comments using btree (author_id);

create trigger tr_comments_set_author
before insert on comments for each row execute function comments_set_author();
```
### 以묒슂 ?뺤씤 ?ъ씤??- `author_id`媛 **NOT NULL**?몃뜲 FK媛 `on delete set null` ?낅땲?? ??議고빀? **異⑸룎**???쇱쑝?듬땲??  
  ??**沅뚯옣**: `author_id uuid null` 濡?蹂寃?**?먮뒗** FK??`on delete` ?숈옉??`restrict`/`cascade`濡?諛붽씀?몄슂.  
  Post/Recipe??writer ?꾨왂怨?**?쇨?**??異붿쿇?⑸땲??

- `parent_type`? `post | recipe` 媛숈? **enum**?쇰줈 異붿젙?⑸땲?? `public.comment_parent_type`??媛믨낵 casing ?쇱튂 ?꾩슂.

- ?몃━嫄?`comments_set_author()`??**?꾩옱 ?몄뀡 ?ъ슜??*瑜?`author_id`??二쇱엯?섎뒗 ?⑥닔?ъ빞 ?⑸땲?? ?녾굅???숈옉???ㅻⅤ硫??꾨옒 ?덉떆瑜?李멸퀬??留뚮뱶?몄슂.

> **李멸퀬**: ?꾨줈?앺듃??Post ?ㅺ퀎瑜?蹂대㈃ `writer_uid`瑜?nullable濡??먭퀬 FK??`on delete set null`???ъ슜?섍퀬 ?덉뒿?덈떎. Comment??媛숈? 泥좏븰???곕Ⅴ??寃??좎?蹂댁닔???덉쟾?⑸땲??

---

## 2) 沅뚯옣 SQL (?덉쟾 ?뺣젹 ?ㅽ겕由쏀듃)
`supabase/sql/000X_comments.sql` 濡??좉퇋 留덉씠洹몃젅?댁뀡 ?뚯씪??異붽??섏꽭??

```sql
begin;

-- 2.1 而щ읆/?쒖빟 ?뺣젹 (?꾩슂 ?쒕쭔 ?ㅽ뻾)
alter table public.comments
  alter column author_id drop not null;  -- on delete set null 怨??뺥빀??
-- 2.2 author ?몃━嫄??⑥닔(誘몄〈???? ?앹꽦
create or replace function public.comments_set_author()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists tr_comments_set_author on public.comments;
create trigger tr_comments_set_author
before insert on public.comments
for each row execute function public.comments_set_author();

-- 2.3 RLS ?뺤콉 (?쎄린 怨듦컻/?곌린 ?쒗븳 ?덉떆)
alter table public.comments enable row level security;

-- ?꾧뎄???쎄린 (parent 湲곗? 怨듦컻 ?뺤콉? ?꾩슂 ??異붽?)
drop policy if exists "comments_read_all" on public.comments;
create policy "comments_read_all"
  on public.comments
  for select
  using (true);

-- 濡쒓렇???ъ슜?먮쭔 ?묒꽦 (?몃━嫄곌? author_id 二쇱엯)
drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth"
  on public.comments
  for insert
  to authenticated
  with check (true);

-- 蹂몄씤留??섏젙/??젣
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments
  for delete
  to authenticated
  using (author_id = auth.uid());

commit;
```

> **?ъ씠???댄럺??*: 湲곗〈 Firebase 寃쎈줈???덈뜕 ??젣/媛깆떊 沅뚰븳 濡쒖쭅??DB濡??대룞?⑸땲?? FE???ㅻ쪟瑜??몃뱾留곷쭔 ?섎㈃ ?⑸땲??

---

## 3) 肄붾뱶 ?닿? ???뚯씪 ?⑥쐞 ?≪뀡
### 3.1 ?쒓굅/援먯껜 ???(Firebase ?섏〈)
- **??젣(?먮뒗 rename + keep for backup)**  
  - `src/features/comment/repository.server.ts`  
    - Firebase Admin (`adminDb`) ?ъ슜. Supabase ?꾪솚 ??**?꾩쟾 ?쒓굅**.
- **?섏젙(?대? 援ы쁽留?Supabase濡?援먯껜)**  
  - `src/app/api/comments/route.ts`  
  - `src/app/api/comments/[id]/route.ts`  
  - `src/features/comment/api.ts` (?붾뱶?ъ씤?몃뒗 ?좎?)

> ?덊띁?곗뒪(?꾩옱 ?뚯씪 ?ㅻ뜑 ?쇰?):
```ts
癤퓁mport "server-only";
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


```

### 3.2 ?좉퇋/?泥??앹꽦 (Post ?꾨찓?멸낵 ?숈씪 援ъ“)
- `src/features/comment/types.ts` ??**Supabase ???湲곕컲?쇰줈 ?ъ옉??*
- `src/features/comment/schema.ts` ??**Zod** ?ㅽ궎留?- `src/features/comment/repository.ts` ??**Supabase** CRUD
- `src/features/comment/service.ts` ???꾩슂??寃쎌슦 沅뚰븳/?좏슚??異붽?

> ?덊띁?곗뒪(寃뚯떆湲 Supabase ?ㅺ퀎):
```ts
import type { PostgrestError } from "@supabase/supabase-js";

import type {
  FetchPostsParams,
  PostInsertDB,
  PostRow,
  PostSupabaseClient,
  PostUpdateDB,
} from "./types";

const POST_COLUMNS = [
  "id",
  "title",
  "content",
  "writer_uid",
  "writer_name",
  "type",
  "number",
  "view_count",
  "created_at",

```

---

## 4) ??援ы쁽 ?ㅽ럺 (?섑뵆 肄붾뱶 ?ㅼ?移?

### 4.1 `src/features/comment/types.ts`
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsertDB = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdateDB = Database["public"]["Tables"]["comments"]["Update"];
export type CommentSupabaseClient = SupabaseClient<Database>;

export interface Comment {
  id: string;
  parentType: string;    // enum string
  parentId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export type FetchCommentsParams = {
  parentType?: string;
  parentId?: string;
  limit: number;
  cursor?: { createdAt: string; id: string };
  authorId?: string;
};
```

### 4.2 `src/features/comment/schema.ts`
```ts
import { z } from "zod";

export const commentInsertSchema = z.object({
  parentType: z.string().min(1),
  parentId: z.string().uuid(),
  body: z.string().min(1),
});

export const commentUpdateSchema = z.object({
  body: z.string().min(1),
});
```

### 4.3 `src/features/comment/repository.ts`
```ts
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  Comment,
  CommentInsertDB,
  CommentSupabaseClient,
  CommentUpdateDB,
  FetchCommentsParams,
} from "./types";

const COLUMNS = [
  "id",
  "parent_type",
  "parent_id",
  "author_id",
  "body",
  "created_at",
  "deleted_at",
] as const;

const toModel = (r: any): Comment => ({
  id: r.id,
  parentType: r.parent_type,
  parentId: r.parent_id,
  authorId: r.author_id,
  body: r.body,
  createdAt: r.created_at,
  deletedAt: r.deleted_at,
});

export async function fetchComments(
  client: CommentSupabaseClient,
  params: FetchCommentsParams
): Promise<{ items: Comment[]; nextCursor: { createdAt: string; id: string } | null; error?: PostgrestError }> {
  const safeLimit = Math.max(params.limit, 1);
  let query = client.from("comments").select(COLUMNS).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(safeLimit);

  if (params.parentType) query = query.eq("parent_type", params.parentType);
  if (params.parentId) query = query.eq("parent_id", params.parentId);
  if (params.authorId) query = query.eq("author_id", params.authorId);

  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.gt.${params.cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) return { items: [], nextCursor: null, error };
  const items = (data ?? []).map(toModel);
  const next = items.length === safeLimit ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id } : null;
  return { items, nextCursor: next };
}

export async function getComment(client: CommentSupabaseClient, id: string) {
  const { data, error } = await client.from("comments").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toModel(data) : null;
}

export async function insertComment(client: CommentSupabaseClient, input: Omit<CommentInsertDB, "author_id"> & { parent_type: string; parent_id: string; body: string }) {
  const { data, error } = await client.from("comments").insert(input).select(COLUMNS).single();
  if (error) throw error;
  return toModel(data);
}

export async function updateComment(client: CommentSupabaseClient, id: string, patch: Partial<CommentUpdateDB>) {
  const { data, error } = await client.from("comments").update(patch).eq("id", id).select(COLUMNS).single();
  if (error) throw error;
  return toModel(data);
}

export async function deleteComment(client: CommentSupabaseClient, id: string) {
  const { error } = await client.from("comments").delete().eq("id", id);
  if (error) throw error;
}
```

### 4.4 `src/features/comment/service.ts` (?듭뀡)
```ts
import { getServerSupabase } from "@/lib/supabase/server";
import { commentInsertSchema, commentUpdateSchema } from "./schema";
import * as repo from "./repository";

export async function listComments(params: Parameters<typeof repo.fetchComments>[1]) {
  const client = getServerSupabase();
  return repo.fetchComments(client, params);
}

export async function createComment(input: unknown) {
  const client = getServerSupabase();
  const { parentType, parentId, body } = commentInsertSchema.parse(input);
  // author_id???몃━嫄곗뿉??二쇱엯
  return repo.insertComment(client, { parent_type: parentType, parent_id: parentId, body });
}

export async function editComment(id: string, input: unknown) {
  const client = getServerSupabase();
  const { body } = commentUpdateSchema.parse(input);
  return repo.updateComment(client, id, { body });
}

export async function removeComment(id: string) {
  const client = getServerSupabase();
  await repo.deleteComment(client, id);
}
```

### 4.5 Route Handlers 援먯껜 (?대?留?Supabase ?몄텧濡?蹂寃?
`src/app/api/comments/route.ts` / `[id]/route.ts`??**???붾뱶?ъ씤?몃? ?좎?**?섍퀬, ?대? ?섏〈留?諛붽씀?몄슂.

```ts
// src/app/api/comments/route.ts (?듭떖留??덉떆)
import * as svc from "@/features/comment/service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const parentType = url.searchParams.get("parentType") ?? undefined;
  const parentId = url.searchParams.get("parentId") ?? undefined;

  const { items, nextCursor } = await svc.listComments({
    limit,
    cursor: cursor
      ? (() => {
          const [createdAt, id] = cursor.split("|");
          return { createdAt, id };
        })()
      : undefined,
    parentType,
    parentId,
  });

  return Response.json({ data: { items, nextCursor } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const json = await req.json();
  const created = await svc.createComment(json);
  return Response.json({ data: created }, { status: 201 });
}
```

```ts
// src/app/api/comments/[id]/route.ts (?듭떖留??덉떆)
import * as svc from "@/features/comment/service";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const item = await svc.listComments({ limit: 1, cursor: undefined, parentId: undefined, parentType: undefined });
  // ?먮뒗 repo.getComment(getServerSupabase(), params.id)
  return Response.json({ data: item });
}

export async function PUT(req: Request, { params }: Ctx) {
  const json = await req.json();
  const updated = await svc.editComment(params.id, json);
  return Response.json({ data: updated });
}

export async function DELETE(_: Request, { params }: Ctx) {
  await svc.removeComment(params.id);
  return new Response(null, { status: 204 });
}
```

> **?ъ씠???댄럺??*: 湲곗〈 `comment.js`(??UI)????곗씠??shape 李⑥씠(`comment` ??`body`, `writerName` ??`authorId/?꾨줈??議고쉶`)濡??명빐 **UI ?곸쓳痢?*???꾩슂?????덉뒿?덈떎. 媛?ν븯硫?`features/user`???꾨줈??議고쉶瑜?議고빀??`author_id ??display_name` 蹂?섏쓣 ?댁＜?몄슂.

---

## 5) UI ?곹뼢 踰붿쐞 (由ъ뒪??泥댄겕由ъ뒪??
- ?볤? ?묒꽦 ?? **?듬챸 ?덉슜 ?щ?**, 濡쒓렇??媛뺤젣 ?щ? (RLS? ?뺤콉???쇱튂)
- ?묒꽦???쒖떆: `author_id` ??`users.display_name` join(酉?荑쇰━) ?꾩슂 ??`comments_with_profile` 酉?怨좊젮
- ?뚰봽????젣(`deleted_at`) ?쒖떆 ?꾨왂: 蹂몃Ц 留덉뒪?? 蹂듦뎄 湲곕뒫 ?꾩슂 ?щ?
- 遺紐??곌껐: `parent_type`, `parent_id`?????**?좏슚??*. 議댁옱?섏? ?딅뒗 遺紐⑥뿉 ???**FK 媛뺤젣**瑜??먰븯硫?蹂꾨룄 FK/?몃━嫄??꾩슂
- ?섏씠吏?ㅼ씠?? `created_at DESC, id ASC` 而ㅼ꽌 ?뺥빀????Post? ?숈씪 ?⑦꽩 ?좎?
- 罹먯떆/ISR: ?볤?? ?곌린/?쎄린 鍮덈쾲 ???꾩옱泥섎읆 `cache: "no-store"` ?좎? 沅뚯옣

---

## 6) ?④퀎蹂??ㅽ뻾 泥댄겕由ъ뒪??1. **SQL 諛섏쁺**: `supabase db push` ?먮뒗 Studio?먯꽌 ?ㅽ뻾 ??RLS/?몃━嫄??곸슜
2. **肄붾뱶 援먯껜**: ??3.2/4?덉쓽 ?뚯씪 ?앹꽦 諛?Route ?대? 援먯껜
3. **Firebase ?붿〈 ?쒓굅**: `repository.server.ts` ??젣, Firebase import 李몄“ ?꾨? ?쒓굅
4. **????뺣━**: `src/features/comment/types.ts`瑜?**Supabase ????먯쿇**?쇰줈 ?ъ옉??5. **UI ?곌껐**: ?묒꽦/?섏젙/??젣/紐⑸줉 ?붾㈃ ?먭? 諛?`author` ?쒖떆 濡쒖쭅 蹂닿컯
6. **?뚯뒪??*: 
   - 鍮꾨줈洹몄씤 read 媛??   - 濡쒓렇??insert 媛?? ?몃━嫄곕줈 author_id 二쇱엯 ?뺤씤
   - 蹂몄씤留?update/delete ?덉슜(RLS濡?李⑤떒?섎뒗吏)
   - 而ㅼ꽌 ?섏씠吏?ㅼ씠??吏꾪뻾/寃쎄퀎媛?寃利?7. **臾몄꽌??*: ??留ㅻ돱?쇱쓣 由ы룷??`docs/comment-migration.md`濡?而ㅻ컠

---

## 7) ??젣/蹂寃쎈릺???щ낵 ?붿빟
- **??젣**: `src/features/comment/repository.server.ts`
- **蹂寃?*:
  - `src/features/comment/types.ts` ??(?? Firebase????(?? Supabase??  - `src/app/api/comments/*` ???대? ?섏〈??service/repository(Supabase)濡?援먯껜

---

## 8) ?뚭? ?꾪뿕(?ъ씠???댄럺?? ?鍮?- **沅뚰븳 ??쟾**: FE?먯꽌 留됰뜕 寃껋쓣 DB RLS濡???린硫댁꽌 **以묐났/?꾨씫**???앷만 ???덉뒿?덈떎. FE??理쒖냼?쒖쓽 **?먮윭 ?몃뱾留?+ UX 硫붿떆吏**留??④린?몄슂.
- **?묒꽦????젣**: `users(id)`媛 ??젣????`author_id`媛 null濡?諛붾뚮뒗 ?뺤콉???앺뻽?ㅻ㈃, **UI?먯꽌 null ?묒꽦???쒓린(Deleted User)** 泥섎━媛 ?꾩슂?⑸땲??
- **parent 臾닿껐??*: ?꾩옱 ?ㅽ궎留덈뒗 `parent_id` FK媛 ?놁뒿?덈떎. ?섎せ??parent濡?insert ?????덉쑝??**?쒕쾭?먯꽌 議댁옱 寃利?* ?먮뒗 **酉??쒖빟** 異붽?瑜?怨좊젮?섏꽭??

---

## 9) 而ㅻ컠 媛?대뱶
- `feat(comment): migrate to Supabase repository/service + add RLS policies`
- `refactor(comment): replace route handlers to call service (remove Firebase admin)`
- `chore(sql): comments trigger & policies & indexes`

---

## 遺濡?A) 湲곗〈 ?뚯씪 ?ㅻ뜑 諛쒖톸 (鍮꾧탳 ??
`src/app/api/comments/route.ts`
```ts
癤?/ src/app/api/comments/route.ts
import { CommentCreateSchema } from "@/features/comment/types";
import * as repo from "@/features/comment/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    const data = await repo.listComments({ limit, cursor, type });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[comments] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

```

`src/app/api/comments/[id]/route.ts`
```ts
// src/app/api/comments/[id]/route.ts
import { CommentUpdateSchema } from "@/features/comment/types";
import * as repo from "@/features/comment/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const item = await repo.getComment(params.id);
  if (!item) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = CommentUpdateSchema.safeParse(json);
    if (!parsed.success)

```

`src/features/comment/types.ts`
```ts
import { z } from "zod";

export const CommentCreateSchema = z.object({
  comment: z.string().min(1),
  writerName: z.string().min(1),
  writerUid: z.string().min(1).optional(),
  type: z.string().min(1), 
});

export const CommentUpdateSchema = z.object({
  comment: z.string().min(1).optional(),
});

export type CommentCreateDTO = z.infer<typeof CommentCreateSchema>;
export type CommentUpdateDTO = z.infer<typeof CommentUpdateSchema>;

export interface Comment {
  id: string;
  comment: string;
  writerName: string;

```
