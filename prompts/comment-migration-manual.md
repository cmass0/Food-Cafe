# Comment 이관 & 리뉴얼 매뉴얼 (Supabase 기준)
_작성일: 2025-10-27 18:53 KST_

본 문서는 **Firebase 기반 Comment 기능**을 **Supabase(Postgres + RLS)** 방식으로 전면 이관하기 위한 단계별 가이드입니다.  
이미 Supabase 전환을 완료한 `post`, `recipe`, `user` 도메인의 설계를 그대로 **재사용/정렬**합니다.

> **대상 리포지토리**: `Food-Cafe-refactor-ts-architecture`  
> **현 상태(발견된 파일)**  
> - API(Route Handlers):  
>   - `src/app/api/comments/route.ts`  
>   - `src/app/api/comments/[id]/route.ts`  
> - Feature/Repository(파이어베이스):  
>   - `src/features/comment/repository.server.ts` (Firebase Admin 사용)  
> - Feature/Types(옛 스키마):  
>   - `src/features/comment/types.ts` (Zod + 낡은 필드명: `comment`, `writerName`, `type` 등)  
> - API Client(Fetch wrapper):  
>   - `src/features/comment/api.ts`

---

## 0) 목표 아키텍처
- `features/post`와 동일한 **Supabase 도메인 레이어 4종**으로 통일
  - `types.ts` — DB Row/Insert/Update 타입 정의 (`Database` 타입 기반)
  - `schema.ts` — Zod 스키마 (입력 검증)
  - `repository.ts` — **Supabase Query 빌더로 CRUD** (+ 커서 페이지네이션, 필터)
  - `service.ts` — 비즈니스 규칙/권한 체크(필요 시)
- **Route Handlers**는 Firebase 의존 제거 → `features/comment/repository.ts` 호출로 교체
- **UI 컴포넌트**는 기존 props를 유지하되, 새 API shape에 맞춰 최소 수정

---

## 1) Supabase 테이블 정의 재점검
요청자가 제공한 현재 스키마(요약):

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
### 중요 확인 포인트
- `author_id`가 **NOT NULL**인데 FK가 `on delete set null` 입니다. 이 조합은 **충돌**을 일으킵니다.  
  → **권장**: `author_id uuid null` 로 변경 **또는** FK의 `on delete` 동작을 `restrict`/`cascade`로 바꾸세요.  
  Post/Recipe의 writer 전략과 **일관**을 추천합니다.

- `parent_type`은 `post | recipe` 같은 **enum**으로 추정됩니다. `public.comment_parent_type`에 값과 casing 일치 필요.

- 트리거 `comments_set_author()`는 **현재 세션 사용자**를 `author_id`에 주입하는 함수여야 합니다. 없거나 동작이 다르면 아래 예시를 참고해 만드세요.

> **참고**: 프로젝트의 Post 설계를 보면 `writer_uid`를 nullable로 두고 FK는 `on delete set null`을 사용하고 있습니다. Comment도 같은 철학을 따르는 게 유지보수에 안전합니다.

---

## 2) 권장 SQL (안전 정렬 스크립트)
`supabase/sql/000X_comments.sql` 로 신규 마이그레이션 파일을 추가하세요.

```sql
begin;

-- 2.1 컬럼/제약 정렬 (필요 시만 실행)
alter table public.comments
  alter column author_id drop not null;  -- on delete set null 과 정합성

-- 2.2 author 트리거 함수(미존재 시) 생성
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

-- 2.3 RLS 정책 (읽기 공개/쓰기 제한 예시)
alter table public.comments enable row level security;

-- 누구나 읽기 (parent 기준 공개 정책은 필요 시 추가)
drop policy if exists "comments_read_all" on public.comments;
create policy "comments_read_all"
  on public.comments
  for select
  using (true);

-- 로그인 사용자만 작성 (트리거가 author_id 주입)
drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth"
  on public.comments
  for insert
  to authenticated
  with check (true);

-- 본인만 수정/삭제
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

> **사이드 이펙트**: 기존 Firebase 경로에 있던 삭제/갱신 권한 로직이 DB로 이동합니다. FE는 오류를 핸들링만 하면 됩니다.

---

## 3) 코드 이관 — 파일 단위 액션
### 3.1 제거/교체 대상 (Firebase 의존)
- **삭제(또는 rename + keep for backup)**  
  - `src/features/comment/repository.server.ts`  
    - Firebase Admin (`adminDb`) 사용. Supabase 전환 시 **완전 제거**.
- **수정(내부 구현만 Supabase로 교체)**  
  - `src/app/api/comments/route.ts`  
  - `src/app/api/comments/[id]/route.ts`  
  - `src/features/comment/api.ts` (엔드포인트는 유지)

> 레퍼런스(현재 파일 헤더 일부):
```ts
﻿import "server-only";
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

### 3.2 신규/대체 생성 (Post 도메인과 동일 구조)
- `src/features/comment/types.ts` — **Supabase 타입 기반으로 재작성**
- `src/features/comment/schema.ts` — **Zod** 스키마
- `src/features/comment/repository.ts` — **Supabase** CRUD
- `src/features/comment/service.ts` — 필요한 경우 권한/유효성 추가

> 레퍼런스(게시글 Supabase 설계):
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

## 4) 새 구현 스펙 (샘플 코드 스케치)

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

### 4.4 `src/features/comment/service.ts` (옵션)
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
  // author_id는 트리거에서 주입
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

### 4.5 Route Handlers 교체 (내부만 Supabase 호출로 변경)
`src/app/api/comments/route.ts` / `[id]/route.ts`는 **현 엔드포인트를 유지**하고, 내부 의존만 바꾸세요.

```ts
// src/app/api/comments/route.ts (핵심만 예시)
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
// src/app/api/comments/[id]/route.ts (핵심만 예시)
import * as svc from "@/features/comment/service";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const item = await svc.listComments({ limit: 1, cursor: undefined, parentId: undefined, parentType: undefined });
  // 또는 repo.getComment(getServerSupabase(), params.id)
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

> **사이드 이펙트**: 기존 `comment.js`(옛 UI)와의 데이터 shape 차이(`comment` → `body`, `writerName` → `authorId/프로필 조회`)로 인해 **UI 적응층**이 필요할 수 있습니다. 가능하면 `features/user`의 프로필 조회를 조합해 `author_id → display_name` 변환을 해주세요.

---

## 5) UI 영향 범위 (리스크 체크리스트)
- 댓글 작성 폼: **익명 허용 여부**, 로그인 강제 여부 (RLS와 정책을 일치)
- 작성자 표시: `author_id` → `users.display_name` join(뷰/쿼리) 필요 시 `comments_with_profile` 뷰 고려
- 소프트 삭제(`deleted_at`) 표시 전략: 본문 마스킹, 복구 기능 필요 여부
- 부모 연결: `parent_type`, `parent_id`에 대한 **유효성**. 존재하지 않는 부모에 대한 **FK 강제**를 원하면 별도 FK/트리거 필요
- 페이지네이션: `created_at DESC, id ASC` 커서 정합성 → Post와 동일 패턴 유지
- 캐시/ISR: 댓글은 쓰기/읽기 빈번 → 현재처럼 `cache: "no-store"` 유지 권장

---

## 6) 단계별 실행 체크리스트
1. **SQL 반영**: `supabase db push` 또는 Studio에서 실행 → RLS/트리거 적용
2. **코드 교체**: 위 3.2/4절의 파일 생성 및 Route 내부 교체
3. **Firebase 잔존 제거**: `repository.server.ts` 삭제, Firebase import 참조 전부 제거
4. **타입 정리**: `src/features/comment/types.ts`를 **Supabase 타입 원천**으로 재작성
5. **UI 연결**: 작성/수정/삭제/목록 화면 점검 및 `author` 표시 로직 보강
6. **테스트**: 
   - 비로그인 read 가능
   - 로그인 insert 가능, 트리거로 author_id 주입 확인
   - 본인만 update/delete 허용(RLS로 차단되는지)
   - 커서 페이지네이션 진행/경계값 검증
7. **문서화**: 이 매뉴얼을 리포에 `docs/comment-migration.md`로 커밋

---

## 7) 삭제/변경되는 심볼 요약
- **삭제**: `src/features/comment/repository.server.ts`
- **변경**:
  - `src/features/comment/types.ts` — (옛) Firebase형 → (신) Supabase형
  - `src/app/api/comments/*` — 내부 의존을 service/repository(Supabase)로 교체

---

## 8) 회귀 위험(사이드 이펙트) 대비
- **권한 역전**: FE에서 막던 것을 DB RLS로 옮기면서 **중복/누락**이 생길 수 있습니다. FE는 최소한의 **에러 핸들링 + UX 메시지**만 남기세요.
- **작성자 삭제**: `users(id)`가 삭제될 때 `author_id`가 null로 바뀌는 정책을 택했다면, **UI에서 null 작성자 표기(Deleted User)** 처리가 필요합니다.
- **parent 무결성**: 현재 스키마는 `parent_id` FK가 없습니다. 잘못된 parent로 insert 될 수 있으니 **서버에서 존재 검증** 또는 **뷰/제약** 추가를 고려하세요.

---

## 9) 커밋 가이드
- `feat(comment): migrate to Supabase repository/service + add RLS policies`
- `refactor(comment): replace route handlers to call service (remove Firebase admin)`
- `chore(sql): comments trigger & policies & indexes`

---

## 부록 A) 기존 파일 헤더 발췌 (비교 용)
`src/app/api/comments/route.ts`
```ts
﻿// src/app/api/comments/route.ts
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
