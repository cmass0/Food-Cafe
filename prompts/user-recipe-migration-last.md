본 문서는 **User 레포 CRUD**, **API 라우트**, **UI/클라이언트(Like & display name)** 진행 상황을 정리하고, 바로 적용 가능한 **다음 단계 체크리스트**와 **권장 타입/코드 스니펫**을 제공합니다.

---

## 진행 현황 한눈에 보기

| 파트 | 범위 | 주요 이슈 | 진행률 |
|---|---|---|---|
| Part 2 | `src/features/user/repository.ts` – CRUD | RLS 미충족 입력, 깨진 예외 메시지, any 타입 남용 | **~50%** |
| Part 3 | API 라우트 `/api/users`, `/api/users/[id]` | 레포 미완성으로 정상 동작 불안, POST/PUT 유효성 메시지 깨짐 | **~50%** |
| Part 4 | UI/클라이언트 (Like 버튼 + display name) | `initialLiked` 하드코딩, 상세 페이지 미배치, 한글 텍스트 깨짐 | **~20%** |

---

## Part 2 — User 레포 CRUD 점검

### 발견된 문제
- **RLS 정책 미준수**: `createUser`/`updateUser`가 `payload`를 그대로 insert/update → 실제 환경에서 **id = auth.uid()** 등 요구 충족 실패 가능성 큼.
- **예외 메시지/주석 깨짐**: `updateSelf`의 예외 문자열 `"로그?�이 ?�요?�니??"` 및 null 처리 코멘트 깨짐.
- **약한 타입 안정성**: `any` 중심(`payload: any`, `patch: any`)으로 **Supabase 타입 유틸** 활용 미흡.

### 권장 가이드
- **RLS 충족 입력 보강**
  - 서버/레포 레이어에서 **현재 사용자 ID를 강제로 적용**: `id = auth.uid()`
  - insert/update 시 **정책에 허용된 필드만** 화이트리스트 방식으로 전달
- **예외/메시지 한국어 정비**
  - `updateSelf` 등 인증 요구 상황: **"로그인이 필요합니다."** 로 통일
  - 주석과 에러 메시지의 **깨진 문자열 제거** 및 통일된 톤 유지
- **Supabase 타입 적극 사용**
  - 예시 (TypeScript):
    ```ts
    type UsersRow = Database["public"]["Tables"]["users"]["Row"];
    type UsersInsert = Database["public"]["Tables"]["users"]["Insert"];
    type UsersUpdate = Database["public"]["Tables"]["users"]["Update"];
    ```
  - 레포 시그니처 강화:
    ```ts
    async function createUser(input: Pick<UsersInsert, "display_name" | "photo_url" | "is_admin">): Promise<UsersRow> { /* ... */ }
    async function updateUser(id: string, patch: UsersUpdate): Promise<UsersRow> { /* ... */ }
    ```

### 스켈레톤(예시)
```ts
// src/features/user/repository.ts
import { getServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type UsersRow = Database["public"]["Tables"]["users"]["Row"];
type UsersInsert = Database["public"]["Tables"]["users"]["Insert"];
type UsersUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function listUsers(): Promise<UsersRow[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function findUserByUsername(username: string): Promise<UsersRow | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("display_name", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getUser(id: string): Promise<UsersRow | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createUser(input: Pick<UsersInsert, "display_name" | "photo_url" | "is_admin">): Promise<UsersRow> {
  const supabase = await getServerSupabase();
  const {data: { user },} = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // RLS 충족: id는 auth.uid()로 고정
  const payload: UsersInsert = {
    id: user.id,
    display_name: input.display_name?.trim() ?? null,
    photo_url: input.photo_url ?? null,
    is_admin: Boolean(input.is_admin),
    email: user.email ?? null,
  };

  const { data, error } = await supabase.from("users").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(id: string, patch: UsersUpdate): Promise<UsersRow> {
  const supabase = await getServerSupabase();
  // 화이트리스트: 허용 필드만 전달
  const allowed: UsersUpdate = {
    display_name: patch.display_name?.trim(),
    photo_url: patch.photo_url,
    is_admin: patch.is_admin,
  };

  const { data, error } = await supabase
    .from("users")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateSelf(patch: UsersUpdate): Promise<UsersRow> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const allowed: UsersUpdate = {
    display_name: patch.display_name?.trim(),
    photo_url: patch.photo_url,
  };

  const { data, error } = await supabase
    .from("users")
    .update(allowed)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

> **주의**: 실제 RLS는 프로젝트 정책에 좌우됩니다. 예: `create`는 `auth.uid() = new.id`, `update`/`delete`는 `auth.uid() = row.id` 등으로 가정.

---

## Part 3 — API 라우트 점검 (`/api/users`, `/api/users/[id]`)

### 발견된 문제
- 레포 미완성으로 라우트가 **정상 동작 불안정**.
- `POST`/`PUT` **유효성 메시지**에 **깨진 한글 문자열** 남아 있음.

### 권장 가이드
- 레포(Part 2) 안정화 후 **간단한 test fetch**로 정상 동작 확인.
- 라우트 레벨 **에러 메시지**를 한국어로 통일 & 깨짐 제거.
- **Zod**로 요청 바디 스키마 검증(선택) → 일관된 400 응답 포맷 유지.

```ts
// 예시: /api/users/route.ts (POST)
import { NextResponse } from "next/server";
import { createUser } from "@/features/user/repository";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // TODO: Zod로 검증 (display_name, photo_url 등)
    const user = await createUser({
      display_name: body.display_name,
      photo_url: body.photo_url,
      is_admin: false,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "처리 중 오류가 발생했습니다." }, { status: 400 });
  }
}
```

---

## Part 4 — UI/클라이언트 (Like 버튼 & display name)

### 발견된 문제
- `RecipeCard.tsx` 의 `<LikeButton>`이 `initialLiked={false}` **하드코딩** → 서버 메타 미연동.
- 깨진 한글 텍스트(??, �ۼ���) 존재.
- **상세 페이지**(`recipes/[id]/page.tsx`)에 **Like 버튼 없음**.
- 작성자 표기가 영문(`Author`, `Anonymous`)이며, **display_name 기반 표시** 요구 미충족.

### 권장 연동 흐름
1. **서버 컴포넌트**에서 `likeMetaAction`(또는 서버 액션/쿼리)을 호출해
   - `initialLiked`, `initialCount` 계산 후 **프롭으로 전달**
2. **상세 페이지**에도 Like 버튼 배치 (카드와 동일한 패턴)
3. **한글 UI 정리**: “작성자”, “조회수”, “좋아요” 등 텍스트 갈무리
4. **display_name 우선 표시**, 없으면 fallback
   - `display_name ?? (user.email 로컬파트) ?? "익명"` 등

```tsx
// 예시: RecipeCard.tsx (서버 컴포넌트 가정)
import LikeButton from "@/components/like-button";
import { getRecipeLikeMeta } from "@/features/like/actions"; // 서버 액션/쿼리 가정

export default async function RecipeCard({ recipeId }: { recipeId: string }) {
  const meta = await getRecipeLikeMeta(recipeId); // { initialLiked, initialCount }
  const author = /* display_name 우선 */;

  return (
    <article className="...">
      {/* ... */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">작성자: {author}</span>
        <LikeButton recipeId={recipeId} initialLiked={meta.initialLiked} initialCount={meta.initialCount} />
      </div>
    </article>
  );
}
```

---

## 체크리스트 (우선순위 순)

### ✅ 1) 레포 RLS/타입 보강
- [ ] `createUser`에서 **id = auth.uid()** 강제 설정
- [ ] insert/update 허용 필드 **화이트리스트** 적용
- [ ] `updateSelf` 예외 메시지 `"로그인이 필요합니다."` 복구
- [ ] `any` 제거 → `UsersInsert/UsersUpdate/UsersRow` 사용
- [ ] 깨진 한글 주석/문자열 전면 정리

### ✅ 2) 라우트 검증/메시지 정리
- [ ] 레포 확정 후 `POST/PUT` 흐름 **test fetch**로 검증
- [ ] 유효성 실패/권한 실패 한국어 메시지 통일
- [ ] (선택) Zod 스키마 도입으로 요청 바디 검증

### ✅ 3) UI 연동 & 한글화
- [ ] 서버에서 `initialLiked`, `initialCount` 내려주기
- [ ] **상세 페이지**에 Like 버튼 추가
- [ ] 텍스트 한글화: “작성자/조회수/좋아요/익명” 등
- [ ] `display_name` 우선 표기, fallback 정리

---

## 수락 기준 (Acceptance Criteria)

- **CRUD**
  - [ ] 로그인 상태에서 `createUser` 성공(서버 로그/DB에서 `id = auth.uid()` 확인)
  - [ ] 본인 계정 `updateSelf` 정상 동작 및 예외 메시지 한글화
  - [ ] 레포/라우트 레벨에서 `any` 제거 및 Supabase 타입 사용
- **API**
  - [ ] `/api/users` `POST` 유효성 실패 시 400 + 명확한 한글 메시지
  - [ ] `/api/users/[id]` `PUT` 권한 실패 시 403 + 한글 메시지
- **UI**
  - [ ] 카드 + 상세에 Like 버튼 노출
  - [ ] 최초 렌더에서 서버 메타 반영(`initialLiked`, `initialCount` 정확)
  - [ ] 작성자 **display_name** 표기, 한글 텍스트 깨짐 없음

---

## 참고

- 실제 RLS는 프로젝트의 **정책 SQL**에 따라 달라질 수 있습니다. 본 문서 예시는 다음을 가정합니다.
  - `INSERT`: `auth.uid() = new.id`
  - `UPDATE/DELETE`: `auth.uid() = users.id`
- 정책 불일치 시 레포 로직에서 **권한 오류**가 즉시 드러납니다. 쿼리 실패 메시지를 로깅/관찰해 조정하세요.
