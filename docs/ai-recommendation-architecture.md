# FoodCafe AI 추천 구조

이 문서는 AI 레시피·콤보 추천 기능의 현재 파일 구조와 앞으로 구현할 UI 구조를 기록한다.

## 현재 결정 사항

- 답변 생성과 임베딩 모델은 Vercel AI Gateway를 통해 호출한다.
- LLM은 Supabase에 직접 접근하지 않는다. 서버의 Tool과 도메인 서비스를 통해서만 검색한다.
- 추천 대상은 `recipe`와 `combo`다.
- 검색은 키워드 검색과 벡터 의미 검색을 결합하고, 사용자가 명시한 조건은 정확한 DB 필터로 적용한다.
- 추천 결과는 검색용 문서의 복사본을 그대로 노출하지 않고 원본 `recipes`, `combos`를 다시 조회한다.
- 임베딩은 `google/gemini-embedding-2`의 768차원으로 고정한다.
- 레시피·콤보 생성·수정 시 저장 서비스가 추천 문서와 임베딩을 갱신한다. 실패해도 원본 저장은 유지하고 백필로 재시도한다.
- 원본 삭제 시 DB Trigger가 해당 추천 문서를 정리한다. 직접 SQL로 삽입한 데이터는 저장 서비스를 거치지 않으므로 별도 백필이 필요하다.
- UI는 navbar의 `AI 추천` 메뉴로 진입하는 `/recommend` 전용 페이지로 구현한다.
- 채팅 메시지와 추천 Tool 결과는 같은 탭의 `sessionStorage`에 저장한다. 상세 페이지에서 뒤로 오거나 F5를 눌러도 복원하며, `새 대화`는 해당 저장값까지 삭제한다.
- AI는 채팅 답변 안에 레시피·콤보 카드를 보내고, 우측에는 `맞춤 추천 / 많이 추천` 탭을 제공한다.
- `맞춤 추천`은 현재 대화 조건에 맞는 결과, `많이 추천`은 다른 사용자에게 자주 추천된 메뉴를 보여준다.

## 전체 흐름

```text
사용자 채팅 입력
  -> src/app/api/recommend/route.ts
  -> src/features/recommend/agent.ts
  -> LLM이 searchRecommendations Tool 호출 여부와 검색 조건 결정
  -> 검색어를 768차원 벡터로 변환
  -> Supabase search_recommendations RPC
     - PostgreSQL 키워드 검색
     - pgvector 의미 검색
     - 사용자가 명시한 정확 조건 필터
     - RRF로 검색 순위 결합
  -> recipes / combos 원본 데이터 재조회
  -> LLM이 후보를 근거로 답변 생성
  -> 채팅 UI로 스트리밍
```

## 벡터 인덱스 선택: HNSW와 IVFFlat

HNSW와 IVFFlat은 `embedding` 컬럼의 가까운 벡터를 빠르게 찾는 pgvector 전용 근사 검색 인덱스다. 별도의 데이터 테이블이 아니라 `recommendation_documents.embedding` 컬럼에 연결되는 PostgreSQL 인덱스 객체다.

| 기준             | HNSW                                                     | IVFFlat                                                  |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| 검색 방식        | 가까운 벡터끼리 연결한 다층 그래프를 탐색                | 벡터를 여러 군집으로 나누고 가까운 군집만 탐색           |
| 검색 속도·정확도 | 일반적으로 빠르고 재현율이 높음                          | `lists`, `probes` 설정과 데이터 분포에 민감              |
| 인덱스 생성      | 테이블이 비어 있어도 생성 가능                           | 대표적인 군집을 만들 데이터가 쌓인 뒤 생성하는 편이 적합 |
| 데이터 변경      | 지속적인 INSERT·UPDATE에도 비교적 안정적                 | 데이터 분포가 크게 바뀌면 인덱스 재생성을 고려해야 함    |
| 메모리·저장 공간 | 그래프 연결 정보를 저장하므로 더 많이 사용               | 일반적으로 HNSW보다 적게 사용                            |
| 쓰기 비용        | 그래프 갱신 비용이 상대적으로 큼                         | 상대적으로 낮음                                          |
| 주요 조절값      | `m`, `ef_construction`, `ef_search`                      | `lists`, `probes`                                        |
| 적합한 상황      | 읽기 중심, 검색 품질 우선, 데이터가 계속 추가되는 서비스 | 메모리 제약이 크고 데이터가 비교적 고정된 대규모 검색    |

정확한 전수 검색과 비교하면 둘 다 일부 정답을 놓칠 수 있는 ANN(Approximate Nearest Neighbor) 인덱스다. 검사 범위를 넓히면 검색 품질은 올라가지만 속도는 느려진다.

FoodCafe는 다음 이유로 HNSW를 우선한다.

- 레시피와 콤보가 서비스 운영 중 계속 생성·수정된다.
- 추천 결과의 품질과 낮은 검색 지연이 메모리 절약보다 중요하다.
- 별도의 군집 수를 먼저 산정해야 하는 IVFFlat보다 초기 운영과 튜닝이 단순하다.
- 현재 데이터는 매우 적어 인덱스가 당장 성능상 필수는 아니다. 768차원 백필과 검색 품질 검증을 먼저 마친 뒤 실행 계획을 확인하고 추가한다.

참고: [Supabase Vector indexes](https://supabase.com/docs/guides/ai/vector-indexes), [pgvector 공식 문서](https://github.com/pgvector/pgvector)

## 파일 트리

표시 기준:

- `[구현됨]`: 현재 코드가 존재한다.
- `[예정]`: UI 또는 후속 백엔드 작업에서 추가할 파일이다.
- `[레거시]`: 새 검색 구조 안정화 후 제거할 이전 구현이다.

```text
src/
├─ app/
│  ├─ api/recommend/
│  │  └─ route.ts                              [구현됨] 채팅 요청을 받아 에이전트 응답을 스트리밍
│  └─ recommend/                              [구현됨] navbar에서 진입하는 AI 추천 전용 화면
│     ├─ page.tsx                             [구현됨] /recommend 페이지 진입점
│     └─ ui/                                  [구현됨] AI 추천 화면 전용 컴포넌트·상태 관리
│        ├─ RecommendChat.tsx                  [구현됨] useChat 스트림·새 대화·화면 조립
│        ├─ RecommendMessageList.tsx           [구현됨] 대화 목록과 초기 안내
│        ├─ RecommendMessage.tsx               [구현됨] 메시지 본문·Tool 결과 렌더링
│        ├─ RecommendComposer.tsx              [구현됨] 하단 입력창·전송
│        ├─ RecommendSidebar.tsx               [구현됨] 탭·빈 상태 UI, 실제 데이터 연결은 예정
│        ├─ RecommendResultCard.tsx            [구현됨] 레시피·조합 상세 링크 카드
│        ├─ RecommendResultCarousel.tsx        [구현됨] 답변 안의 추천 카드 캐러셀
│        ├─ useRecommendSession.ts             [구현됨] 브라우저 복원·저장 시점·이동 시 저장 마무리
│        ├─ session.ts                         [구현됨] 세션 저장·검증·중단된 메시지 복원
│        ├─ session.test.ts                    [구현됨] 대화·카드 보존, 손상·저장 실패 검증
│        └─ types.ts                           [구현됨] 화면 컴포넌트·세션 훅 타입
│
├─ component/navbar/
│  └─ nav-bar.tsx                             [구현됨/수정 예정] 데스크톱·모바일 메뉴에 AI 추천 링크 추가
│
├─ domain/
│  ├─ combo/
│  │  ├─ normalization.ts                      [구현됨] 콤보 JSON 단계·아이템 공통 정규화
│  │  └─ service.ts                            [구현됨] 기존 서비스가 공통 정규화 함수를 재사용
│  └─ recommend/
│     ├─ document.ts                           [구현됨] 레시피·콤보를 임베딩용 검색 문서로 변환
│     ├─ document.test.ts                      [구현됨] 검색 문서 변환 규칙 단위 테스트
│     ├─ repository.ts                         [구현됨] 추천 RPC 호출과 원본 데이터 재조회
│     ├─ schema.ts                             [구현됨] AI Tool 검색 입력 검증과 기본값
│     ├─ service.ts                            [구현됨] 검색 결과 조립과 RPC 순위 복원
│     ├─ service.test.ts                       [구현됨] 추천 도메인 서비스 단위 테스트
│     ├─ schema.test.ts                        [구현됨] 추천 검색 입력 규칙 단위 테스트
│     └─ types.ts                              [구현됨] 검색 조건·후보·순위 타입
│
├─ features/recommend/
│  ├─ agent.ts                                 [구현됨] 추천 에이전트와 시스템 지침
│  └─ tools/
│     ├─ search-recommendations.ts             [구현됨] 임베딩 생성 후 통합 추천 검색 실행
│     └─ search-recipes.ts                     [레거시] 기존 레시피 전용 검색 Tool
│
├─ lib/ai/
│  ├─ model.ts                                 [구현됨] 답변 모델·임베딩 모델 Gateway 생성
│  ├─ embedding-config.ts                      [구현됨] 추천 임베딩 차원과 provider 옵션을 768로 고정
│  ├─ embedding.ts                             [구현됨] 사용자 검색어 임베딩 생성
│  ├─ embedding-input.ts                       [구현됨] Gemini 검색어·문서 입력 형식 생성
│  ├─ embedding-input.test.ts                  [구현됨] 임베딩 입력 형식 단위 테스트
│  ├─ recommendation-document.ts              [구현됨] 문서 입력·해시·RPC 페이로드 변환
│  ├─ recommendation-document.test.ts         [구현됨] 문서 임베딩 규격 단위 테스트
│  └─ recommendation-index.ts                 [구현됨] 저장 후 임베딩·색인 동기화
│
└─ types/
   └─ supabase.ts                              [구현됨] 추천 RPC 타입

tools/
└─ recommend/
   └─ backfill.ts                              [구현됨] 기존 레시피·콤보 검색 문서와 임베딩 일괄 생성

supabase/
├─ migrations/
│  ├─ 20260921195833_create_recommendation_documents.sql
│  │                                            [구현됨] 추천 검색 문서 테이블 생성
│  ├─ 20260921195835_create_search_recommendations_rpc.sql
│  │                                            [구현됨] 키워드·벡터 하이브리드 검색 RPC 생성
│  ├─ 20260921195837_manage_recommendation_documents_for_backfill.sql
│  │                                            [구현됨] 백필 상태 조회·일괄 저장 RPC 생성
│  ├─ 20260921204432_fix_recommendation_embedding_dimension.sql
│  │                                            [구현됨] 임베딩 컬럼을 vector(768)로 고정
│  └─ 20260922192014_cleanup_recommendation_documents_on_source_delete.sql
│                                               [구현됨] 레시피·콤보 삭제 시 파생 문서 정리
└─ tests/database/rpc/
   └─ search_recommendations.test.sql           [예정] 실제 Postgres RPC 계약 pgTAP 테스트
```

## 백필 구현 때 추가·수정한 파일

### 검색 문서 생성

- `src/domain/recommend/document.ts`
- `src/domain/recommend/document.test.ts`
- `src/domain/combo/normalization.ts`
- `src/domain/combo/service.ts`

### 임베딩 입력과 생성

- `src/lib/ai/embedding-config.ts`
- `src/lib/ai/embedding.ts`
- `src/lib/ai/embedding-input.ts`
- `src/lib/ai/embedding-input.test.ts`
- `src/lib/ai/model.ts`

### 백필 실행

- `tools/recommend/backfill.ts`
- `package.json`의 `recommend:backfill` 명령
- `.env.example`의 `AI_RECOMMEND_EMBEDDING_MODEL`

### 데이터베이스

- `supabase/migrations/20260921195833_create_recommendation_documents.sql`
- `supabase/migrations/20260921195835_create_search_recommendations_rpc.sql`
- `supabase/migrations/20260921195837_manage_recommendation_documents_for_backfill.sql`
- `supabase/migrations/20260921204432_fix_recommendation_embedding_dimension.sql`
- `src/types/supabase.ts`

## UI/UX 기본 방향

### 진입과 화면 배치

- navbar에 `AI 추천` 메뉴를 추가하고 `/recommend`로 이동한다. 추천 범위는 레시피와 콤보를 모두 포함한다.
- 데스크톱은 왼쪽 채팅 약 2/3, 오른쪽 추천 탐색 약 1/3의 두 열로 구성한다. 채팅 안의 추천 카드가 주 콘텐츠이며 우측은 보조 탐색 영역이다.
- 상단에는 `AI 추천` 제목·짧은 설명·`새 대화` 버튼을 배치한다. 입력창은 채팅 영역 하단에 고정하고 메시지 영역은 스크롤한다.
- 전용 화면의 컴포넌트는 `src/app/recommend/ui/`에 둔다. 전역 플로팅 위젯과 이를 위한 `app/layout.tsx` 수정은 사용하지 않는다.

```text
기존 navbar · AI 추천 활성
AI 추천                                           새 대화

왼쪽: 채팅                              오른쪽: 추천 둘러보기
┌────────────────────────────────┐      ┌────────────────────────┐
│ AI 안내                        │      │ 맞춤 추천 | 많이 추천  │
│                 사용자 요청    │      │                        │
│ AI 답변과 추천 이유            │      │ [썸네일] 종류·제목     │
│ [레시피 카드] [콤보 카드]       │      │          짧은 설명     │
│                 추가 조건      │      │ [썸네일] 종류·제목     │
│ AI 후속 답변과 추천 카드       │      │          짧은 설명     │
│                                │      │ ...                    │
├────────────────────────────────┤      └────────────────────────┘
│ 메시지 입력               전송 │
└────────────────────────────────┘
```

### 채팅과 결과 카드

- 첫 화면에는 예시 질문과 자유 입력을 제공한다. 사용자가 재료·취향·추가 조건을 말하면 AI가 대화를 이어가며 추천한다.
- 사용자 메시지는 오른쪽 말풍선, AI 메시지는 왼쪽에 표시한다. 추천 이유는 AI 답변 본문에 적고, 실제 추천 카드는 해당 답변 바로 아래에 첨부한다.
- 카드는 원본을 재조회한 구조화된 추천 데이터로 렌더링한다. AI가 작성한 텍스트에서 제목이나 URL을 추측해 카드를 만들지 않는다.
- 채팅 카드는 이미지·작은 `레시피/콤보` 구분·제목·짧은 설명만 담는다. 제목은 한 줄 `truncate`, 설명은 두 줄 `line-clamp-2`로 제한한다. 시간·난이도·일치율 등의 배지는 기본 구성에 넣지 않는다.
- 채팅 카드는 데스크톱에서 한 행에 2개 정도가 보이는 크기로 배치한다. 카드 전체를 링크로 제공하고, 선택 시 원본 레시피 또는 콤보 상세 페이지로 이동한다.
- 조건 변경에 따른 새 추천은 새 AI 답변에 붙인다. 이전 메시지의 카드는 해당 답변에 유지하여 대화 맥락을 보존한다.

### 같은 탭에서 대화 유지

- `food-cafe:recommend:chat:v1` 키로 `UIMessage[]` 전체를 `sessionStorage`에 저장한다. 텍스트뿐 아니라 카드의 Tool 결과·메시지 ID도 보존한다.
- 브라우저에서 마운트한 뒤 검증·복원하며, 복원이 끝나기 전에는 입력을 잠시 막아 기존 기록을 빈 대화로 덮어쓰지 않는다.
- 스트리밍 중 저장은 250ms 디바운스로 묶고, 페이지 이동·`pagehide` 때에는 마지막 메시지를 즉시 저장한다.
- 복원 자체는 AI를 호출하지 않는다. 이동 중 끊긴 검색은 종료된 오류 상태로 복원해 무한 로딩이나 자동 재호출을 방지한다. 서버 스트림 재개 기능은 아니다.
- `새 대화`는 진행 중 응답을 중지하고 화면과 해당 저장 키를 함께 비운다. 다른 기능의 세션 저장값은 삭제하지 않는다.
- 손상된 저장값은 빈 대화로 복구한다. 브라우저 저장 차단·용량 초과 시 채팅은 계속 사용할 수 있고 보존이 안 될 수 있다는 안내를 표시한다.
- 전송한 대화만 보관한다. 입력 중 초안·스크롤 위치·우측 탭은 저장 대상이 아니며, 계정·기기 간 동기화도 하지 않는다.

### 우측 추천 탐색

`추천 둘러보기` 아래에 `맞춤 추천 / 많이 추천` 탭을 둔다. 두 목록 모두 레시피·콤보를 함께 보여주고 종류를 구분한다.

| 탭        | 표시 내용                                               | 갱신과 빈 상태                                                                          |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 맞춤 추천 | 현재 대화 조건에 맞는 최신 추천 결과를 모아보기         | 새 추천 결과가 확정되면 갱신한다. 추천 전에는 재료나 취향을 입력하도록 안내한다.        |
| 많이 추천 | 다른 사용자에게 자주 추천된 메뉴를 추천 빈도순으로 표시 | 대화 조건과 별개인 집계 목록이다. 집계 데이터가 없으면 준비 중 또는 빈 상태를 표시한다. |

- 우측 카드는 작은 썸네일 옆에 종류·제목 한 줄·설명 최대 두 줄을 배치한다. 채팅 카드보다 작게 구성하고 같은 `RecommendationResultCard`의 축약 변형을 사용한다.
- `맞춤 추천`은 이전 답변을 스크롤하지 않고 최신 결과를 다시 찾는 용도다. 채팅 카드와 일부 결과가 겹치는 것은 의도된 동작이다.
- `많이 추천`은 좋아요·조회수 기반 인기 랭킹과 다르다. 실제 추천 이력 집계가 필요하며, 검색 후보로 반환된 것과 사용자에게 추천 카드로 전달된 것을 구분해야 한다.
- 집계 기간, 추천 1회의 정의, 동일 사용자·대화의 반복 추천 처리, 동점 정렬 기준은 후속 결정 사항이다. 목업의 `최근 7일`과 순위는 예시이며 확정된 집계 정책이 아니다.
- 많이 추천 집계·조회 기능은 별도 후속 백엔드 작업이다. 기존 검색 RPC가 이 집계를 제공한다고 가정하지 않으며, 구체적인 API·저장 파일은 집계 계약을 확정한 뒤 파일 트리에 추가한다.

### 반응형·상태·시각 스타일

- 두 열을 유지하기 어려운 화면에서는 `대화 / 추천` 전환으로 구성한다. 추천 화면 안에서 `맞춤 추천 / 많이 추천` 탭을 유지한다. 화면 전환 시 대화·입력 중인 내용·선택한 탭을 보존한다.
- 모바일 채팅 카드는 가로 스크롤로 탐색하고 다음 카드 일부가 보이도록 한다. 입력창은 가상 키보드에 가리지 않게 배치한다.
- 스트리밍 중에는 생성 중 상태와 중지 버튼을 제공한다. `새 대화`는 현재 대화·입력·맞춤 추천을 초기화하고 초기 안내로 돌아간다. 전체 사용자 기준의 많이 추천 목록은 별도로 유지한다.
- 검색 결과가 없으면 AI가 존재하지 않는 콘텐츠를 만들지 않고 조건 완화를 제안한다. 채팅 오류와 우측 목록의 로딩·빈 결과·오류를 각각 표시하여 한쪽 실패가 다른 영역을 가리지 않게 한다.
- 기존 FoodCafe의 흰 배경·zinc 텍스트·녹색 `#34783f` 포인트를 따른다. 우측 영역은 연한 세이지 배경, 카드는 얇은 테두리와 작은 모서리 곡률로 구분하고 과한 장식을 피한다.
- 탭·카드 링크·전송·중지·새 대화의 키보드 조작과 포커스 표시, 접근성 이름, 모바일 터치 영역을 보장한다. 한국어 조합 중 Enter는 전송하지 않고, Enter 전송·Shift+Enter 줄바꿈을 제공한다.

## 남은 작업

1. 기존 데이터 백필을 실제 실행한다.
2. 레시피·콤보 저장·삭제 시 색인 동기화는 구현했다. 실패 상태의 자동 재시도는 아직 없으며 백필 명령으로 수동 재시도한다.
3. 의미 유사도 임계값을 실제 검색 결과로 결정한다.
4. 데이터 규모와 실행 계획을 확인한 후 HNSW 인덱스를 추가한다.
5. 추천 API 요청 횟수 제한을 추가한다.
6. 새 RPC의 pgTAP 테스트와 통합 서비스 테스트를 작성한다.
7. navbar 진입·전용 채팅 페이지·답변 내 추천 카드·우측 추천 탭·모바일 전환 UI를 구현한다.
8. `많이 추천`의 집계 기준을 확정하고 추천 이력 집계·조회 및 UI 연결을 구현한다.
9. 새 검색 흐름이 안정화되면 `searchRecipes` 전용 코드를 제거한다.
