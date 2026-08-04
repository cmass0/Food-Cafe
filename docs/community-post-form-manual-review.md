# 커뮤니티 게시글 작성 폼 매뉴얼 검토 보고서

> 대상 문서: [community-post-form-implementation-manual.md](./community-post-form-implementation-manual.md)
> 검토 방법: 매뉴얼의 각 항목을 실제 코드와 전수 대조
> 검토일: 2026-07-22

## 종합 판정

**적합도: 상(上) — 실행 가능하되, 백필 규칙 보강이 선행 조건.**

매뉴얼의 핵심 진단 두 가지(자유 입력 `type`, 클라이언트발 `content_text`)는 모두 실제 코드에서 확인되는 진짜 문제이며, 작업 순서(데이터 계약 → DB → 서버 → UI → 연동)도 합리적이다. 다만 아래 3가지를 매뉴얼에 반영한 뒤 착수해야 한다.

| # | 선행 보완 사항 | 이유 |
| --- | --- | --- |
| 1 | 백필 시 enum에 매핑되지 않는 값의 **폴백 규칙** 명시 | 임의 문자열·한글 값이 DB에 존재할 가능성 → 마이그레이션 실패 위험 |
| 2 | 카테고리 값 rename에 따른 **UI 파일 수정 목록** 추가 | §3의 대상 파일 목록만으로는 범위 부족 |
| 3 | **신규 `category` 컬럼 vs 기존 `type` 컬럼 제약** 중 택일 결정 | 두 방식의 비용 차이가 크지만 매뉴얼에 트레이드오프 언급 없음 |

---

## 1. 매뉴얼이 정확하게 짚은 부분 (현재 코드의 실제 문제)

### 1-1. `type` 자유 입력 문제 — 사실

- `src/domain/post/ui/PostForm.tsx:160-174` — 타입을 일반 텍스트 `Input`으로 입력받아 사용자가 아무 문자열이나 저장 가능.
- `src/domain/post/schema.ts:25` — 서버 검증도 `z.string().max(40)`으로 길이만 확인, 허용 값 제한 없음.
- `src/domain/post/ui/postType.ts` — `"자유"`, `"질문"`, `"후기"` 등 한글 값 매핑이 존재하는 것 자체가 이미 임의 값이 저장돼 왔다는 증거.

→ 드롭다운 + enum 검증으로 전환하자는 매뉴얼 §1의 제안은 **적절**.

### 1-2. `content_text`를 클라이언트가 보내는 문제 — 유효한 지적

- `src/app/posts/actions.ts:110` — hidden input으로 받은 `content_text`를 그대로 저장.
- 검색(제목·내용)이 `content_text` 기반 `ilike` 쿼리이므로, 값을 조작하면 검색 결과와 실제 본문이 어긋날 수 있음.

→ 서버에서 `content_json`으로부터 생성하자는 §1의 방침이 **옳음**.

### 1-3. `content_html`은 이미 매뉴얼 요구대로 구현됨

- `src/domain/post/service.ts:100` — 서버가 `buildPostContentHtml`로 생성.
- `src/domain/post/ui/PostContentHtml.ts:119` — allowlist 기반 sanitize, YouTube 카드 변환 모두 매뉴얼 서술과 일치.

→ §3의 "유지한다" 서술 **정확**.

### 1-4. 카테고리 표기 불일치 — 매뉴얼의 문제의식을 실증하는 버그 존재

- 목록 화면(`src/app/posts/page.tsx:32`)은 `info`를 **"레시피 팁"** 으로 표시.
- 상세 화면이 쓰는 `src/domain/post/ui/postType.ts:8`은 `info`를 **"정보공유"** 로 표시.
- 같은 글이 목록과 상세에서 다른 게시판 이름으로 보이는 상태.

→ 단일 필드·단일 매핑으로 통일하자는 §5는 **필요한 작업**.

### 1-5. 상세 하단 목록 연동(§5)은 이미 구현됨

- `src/app/posts/[id]/page.tsx` — `post.type` + `listPage` 기준 조회 구현 완료.
- §5는 "새 작업"이 아니라 **현재 구조를 카테고리 체계로 갈아타는 작업**.

---

## 2. 부정확하거나 보완이 필요한 부분

### 2-1. 백필 계획이 실제 데이터 상태를 감당하지 못함 ⚠️ (가장 중요)

§2는 "기존 `board`는 `free`로 변환"만 언급하지만, 자유 입력 폼 때문에 실제 DB에는 다음 값들이 섞여 있을 수 있다.

- `info`, `question`, `review` 등 코드가 아는 값
- `"자유"`, `"질문"`, `"후기"` 등 한글 값
- 그 외 사용자가 입력한 임의 문자열

이 상태에서 `NOT NULL` + check constraint를 걸면 **매핑되지 않는 행에서 마이그레이션이 실패**한다.

**보완안:** 백필 규칙에 "enum에 매핑되지 않는 값은 `free`로 폴백" 조항을 명시할 것.

### 2-2. 카테고리 값 이름이 현재 코드와 어긋남

| 구분 | 매뉴얼 권장 | 현재 코드 |
| --- | --- | --- |
| 자유게시판 | `free` | `board` |
| 레시피 팁 | `recipe_tip` | `info` |
| 질문&답변 | `question` | `question` |
| 후기 | `review` | `review` |

값 변경 자체는 가능하지만, rename 시 수정해야 할 파일 목록이 매뉴얼에 빠져 있다.

**§3 대상 파일 목록에 추가해야 할 파일:**

- `src/app/posts/page.tsx` — `POST_CATEGORIES` 상수
- `src/domain/post/ui/postType.ts` — 라벨 매핑
- `src/app/posts/components/PostCategorySelect.client.tsx`
- `src/app/posts/components/PostBoardToolbar.client.tsx`
- 기존 URL(`?type=board` 등) 하위 호환 처리

### 2-3. `category` 신규 컬럼 vs `type` 컬럼 재활용 — 트레이드오프 언급 없음

코드 전체(스키마, 리포지토리, URL 파라미터, 목록/상세/검색)가 `type`을 사용 중이다.

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 신규 `category` 컬럼 (매뉴얼 방식) | 의미가 명확한 이름, 깨끗한 시작 | 과도기 동안 두 필드 공존, 코드 전면 rename 필요 |
| 기존 `type`에 check constraint 추가 | 변경 범위 최소 | 컬럼명이 다소 모호하게 유지됨 |

매뉴얼 방식이 틀린 것은 아니나, **변경 비용 차이가 크므로 착수 전 택일 결정이 필요**하다.

### 2-4. RLS 요구사항(§2)은 코드로 검증 불가능한 전제

- 리포지토리에 마이그레이션 파일 없음 (`supabase/`에는 `config.toml`뿐).
- 현재 권한 통제는 서버 액션의 `auth.getUser()` + 리포지토리의 `eq("writer_uid")` 필터(`src/domain/post/repository.ts:126-154`)에 의존.
- "폼 로그인 체크는 보안 장치가 아니다"라는 매뉴얼의 강조는 옳으며, 작업 순서 1번에 RLS 확인을 배치한 것도 적절.

**단, 실행 시 Supabase 대시보드에서 RLS 활성화 여부를 반드시 직접 확인해야 한다.**

### 2-5. 소소한 확인 사항

| 항목 | 판정 |
| --- | --- |
| 제목 150자 제한 | 현재 스키마와 일치 ✓ |
| 취소 확인 모달 | 이미 구현됨 — §4 중 신규 작업 아님 |
| pending 상태 버튼 | 이미 구현됨 — §4 중 신규 작업 아님 |
| 오류 표시 방식 | 현재는 모달, 매뉴얼은 `role="alert"` 인라인 영역 → UI 방침 변경이나 접근성 면에서 매뉴얼 쪽이 우수 |
| `(category, created_at, id)` 인덱스 | 현재 정렬 쿼리(`created_at desc, id asc`)와 부합하는 제안 ✓ |

---

## 3. 결론 및 권장 진행 순서

매뉴얼의 진단·방향·작업 순서는 신뢰할 수 있다. 아래 순서로 진행을 권장한다.

1. **결정:** 신규 `category` 컬럼 vs 기존 `type` 컬럼 제약 중 택일 (§2-3)
2. **매뉴얼 보강:** 백필 폴백 규칙(§2-1)과 UI 수정 파일 목록(§2-2) 반영
3. **확인:** Supabase 대시보드에서 RLS 활성화 여부 검증 (§2-4)
4. 이후 매뉴얼의 "권장 작업 순서" 그대로 진행
