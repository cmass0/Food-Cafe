# 작업 체크리스트 (User 레포 · API · UI)

> 마지막 업데이트: 2025-10-11 (Asia/Seoul)

---

## Part 2 – User 레포 CRUD (목표: RLS 정합성 + 타입 안정화)

- [o] createUser: 세션에서 `auth.uid()` 사용해 `id` 강제 세팅
  - 서비스: `getServerSupabase() → supabase.auth.getUser()`로 `user.id` 확보
  - 레포 호출: `insertUserRecord(supabase, { id: user.id, display_name, email, photo_url, created_at, updated_at })`
  - 금지 필드 제외: `role`, `is_admin` 등 권한 관련 컬럼 절대 포함 금지

- [ ] updateSelf: 본인만 수정되도록 강제
  - 서비스: `user.id`로 `.eq('id', user.id)` 되도록 `repository.updateUserRecord(supabase, user.id, payload)` 호출
  - `buildUpdatePayload`에서 허용 필드만 적용, `updated_at` ISO 갱신
  - 빈 문자열 이름 등은 Zod로 차단(공백 → 오류)

- [ ] updateUserById(관리자 경로): 관리자만 허용/차단 결정
  - 일반 사용자 경로에서는 `params.id !== auth.uid()`면 403 반환 권장
  - 관리자만 허용 시 별도 권한 체크 또는 SRK 클라이언트 사용

- [ ] deleteUserById: 정책에 맞게 본인만/관리자만 허용
  - 본인만: `repository.deleteUserRecord(supabase, user.id)` 형태로 강제
  - 관리자만: 별도 경로/권한 체크

- [ ] listUsers · findUserByDisplayName: RLS 읽기 정책 확인 후 최소 컬럼 선택
  - 현재 안전성 위해 `select('*')` 사용 중 → 성능 최적화 필요 시 리터럴 문자열 컬럼으로 교체
  - 검색은 부분 매칭 시 `ilike('display_name', '%' + q + '%')`

- [ ] 메시지 정비: 깨진 한글 복구(예: "로그인이 필요합니다."), 에러 메시지 일관화

- [ ] 타입: `UserInsertDB`/`UserUpdateDB`/`UserRow` 사용 유지, 캐스팅 지양

---

## Part 3 – API 라우트 (/api/users, /api/users/[id])

- [ ] GET /api/users/[id]: 404/401/403 구분 응답
  - 인증 없음 → 401, 권한 없음 → 403, 데이터 없음 → 404
  - `Cache-Control: no-store` 유지(민감 데이터)
- [ ] PUT /api/users/[id]: Self 또는 Admin 전략 선택
  - Self 전용: 라우트에서 `params.id === auth.uid()` 검증 후 `updateSelf` 호출
  - Admin 전용: 관리자 권한 체크 후 `updateUserById(params.id, body)`
  - 유효성 실패 메시지 한글 복구 및 상세화
- [ ] DELETE /api/users/[id]: Self/Admin 정책에 맞춰 처리(상동)
- [ ] POST /api/users: Self 생성만 허용(콜백/최초 로그인 시점) 또는 관리자만 허용
- [ ] 에러 매핑 표준화: 400(유효성), 401/403(권한), 404(없음), 500(서버)

---

## Part 4 – UI/클라이언트 (Like 버튼 · display_name 표기)

- [ ] 서버에서 좋아요 메타 주입: `initialLiked`, `initialCount` 전달
  - 예: 카드/상세 서버 컴포넌트에서 `user_like` 레포 호출 후 프롭으로 내려주기
- [ ] 상세 페이지(`recipes/[id]/page.tsx`)에 Like 버튼 배치
- [ ] 한글 텍스트 정리: “작성자”, “조회수”, 오류 문구 등 인코딩 깨짐 제거
- [ ] 작성자 표기: `display_name` 우선, 없으면 대체값(예: "익명")
- [ ] 목록 화면은 경량 컬럼 사용(필요 시 API/레포에서 부분 컬럼으로 최적화)

---

## 메모

- RLS 정합성 핵심: INSERT는 `id = auth.uid()`로 저장, UPDATE는 `.eq('id', user.id)`로 본인 행만 수정, 권한 컬럼 제외
- 타입 안정성: Supabase 제네릭 추론 유지(`select('*')` 또는 리터럴 컬럼 문자열), 임의 캐스팅 지양
- 관리자 기능은 별도 권한 체크 또는 SRK 사용(일반 요청에 SRK 금지)
