# 데이터베이스 테스트

이 디렉터리는 Supabase CLI와 pgTAP으로 실행하는 로컬 전용 DB 테스트를 담습니다.

```bash
npm run test:db
```

테스트는 다음 네 영역으로 분리합니다.

- `views/`: 공개 View의 컬럼과 실행 권한
- `rls/`: 역할별 행 접근과 컬럼 변경 권한
- `rpc/`: 외부 호출 함수의 권한, 반환값, 정렬 규칙
- `triggers/`: 회원 생성과 집계 카운터의 연쇄 변경

각 파일은 트랜잭션 안에서 테스트 데이터를 만들고 마지막에 `ROLLBACK`합니다. `--linked`나 운영 DB URL로 실행하지 않습니다.

실행 전 로컬 DB에 모든 마이그레이션이 적용되어 있어야 합니다. 원격에만 적용한 마이그레이션이 있으면 테스트가 옛 스키마를 기준으로 실패하므로 먼저 누락분을 적용합니다.

```bash
npx supabase migration list --local   # Local 열만 있고 두 번째 열이 비어 있으면 미적용
npx supabase migration up --local     # 로컬 데이터를 유지한 채 누락된 마이그레이션만 적용
```

로그인 사용자 권한으로 쓰기를 검증할 때는 앱과 같은 컬럼만 보냅니다. 컬럼 단위 INSERT 권한에 없는 `id` 같은 컬럼을 지정하면 `permission denied`로 실패하므로, 테스트용 id가 필요하면 `reset role` 뒤 관리자 권한으로 붙입니다.
