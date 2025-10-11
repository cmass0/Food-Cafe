# 점검 요약 (User 레포 & API & UI)

> 마지막 업데이트: 2025-10-11 (Asia/Seoul)

---

## Part 2 – User 레포 CRUD

**위치:** `src/features/user/repository.ts`  
**상태:** `listUsers`, `findUserByUsername`, `getUser`, `createUser`, `updateUser`, `deleteUser` 뼈대 존재(완성도 낮음)

### 문제점

- `createUser`/`updateUser`가 Supabase RLS 정책 충족 입력(예: `id = auth.uid()`)을 세팅하지 않고 `payload`를 그대로 insert/update → 실제 환경에서 실패 가능성 큼
- `updateSelf` 예외 메시지 깨짐: `"로그?�이 ?�요?�니??"` (null 처리 코멘트도 깨져 있어 재정비 필요)
- 리턴 타입이 `any` 기반(`payload: any`, `patch: any`) → Supabase 타입 유틸 활용 부족

**진행률:** 약 **50%** (CRUD 함수 존재는 하나, 검증/RLS/타입 보강 및 테스트 미완료)

---

## Part 3 – API 라우트 (`/api/users`, `/api/users/[id]`)

**상태**

- 라우트 파일은 Supabase 레포(`repo.*`) 호출 구조
- 레포 미완성으로 실제 요청 시 정상 동작 담보 어려움
- `POST/PUT`의 유효성 메시지에 **깨진 문자열** 남아 있음

**진행률:** 약 **50%** (구조는 갖췄으나 레포 미완성으로 실제 동작 불안)

---

## Part 4 – UI/클라이언트 (Like 버튼 + display name 표기)

### 문제점

- `RecipeCard.tsx`에 `<LikeButton>` 존재하나 `initialLiked={false}`로 하드코딩 → 서버 메타 연동 전무
- LikeButton 호출부 및 주변 텍스트에 **깨진 한글**(??, �ۼ���) 존재
- 레시피 상세 페이지(`recipes/[id]/page.tsx`)에 **Like 버튼 없음**
- 작성자 표기가 영문(`Author`, `Anonymous`)이며 **display_name 기반 표기** 미충족

**진행률:** 약 **20%** (버튼 삽입 일부, 서버 메타 및 한글 UI 정리 미완)

---

## 결론 및 다음 단계

### 레포 정비 (Part 2)

- `createUser`: 현재 로그인 사용자 ID 강제 세팅(`id = auth.uid()`), 정책 허용 필드만 insert
- `updateUser`/`listUsers`/`findUserByUsername`: Supabase 타입(`UserInsertDB`, `UserUpdateDB` 등) 활용해 타입 안정성 확보
- `updateSelf` 예외 메시지: **“로그인이 필요합니다.”**로 복구, 깨진 한글/주석 정리

### 라우트 점검 (Part 3)

- 레포 정비 후 간단 테스트 호출로 정상 동작 확인
- `POST/PUT` 응답 유효성 메시지의 깨진 문자열 수정

### UI 연동 (Part 4)

- 서버 컴포넌트에서 `likeMetaAction` 등 호출 → **`initialLiked`, `initialCount`** 값을 내려주기
- 상세 페이지에도 Like 버튼 배치
- 카드/상세 한글 텍스트(“작성자”, “조회수” 등) 정상화
- 작성자 표기를 **display_name 기반**으로 표시
