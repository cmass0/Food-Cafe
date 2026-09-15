# AI 테스트 작성 매뉴얼 (단위 테스트)

문서 버전: 1.1
작성 기준일: 2026-09-10
짝 문서: AGENTS.md (대상 선정) — 이 문서는 작성법만 담당
근거: [Vitest — Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)
대상: 이 저장소에서 Vitest 단위 테스트를 작성하는 AI 에이전트 및 검토자

---

## 0. 이 문서의 사용법

**AI에게**: 이 저장소에서 테스트를 작성·수정하기 전에 이 문서를 먼저 읽는다. 여기 적힌 규약이 일반적인 관례보다 우선한다.

**사람에게**: 테스트 작성을 요청할 때 `docs/ai-test-authoring-manual.md`를 읽으라고 지시한다. 생성된 결과는 §5 체크리스트로 검토한다.

---

## 1. 프로젝트 컨텍스트

AI가 테스트를 쓰기 전에 반드시 알아야 하는 사실이다.

### 실행 환경

| 항목          | 값                                                                          |
| ------------- | --------------------------------------------------------------------------- |
| 러너          | Vitest 5.0.0                                                                |
| 설정 파일     | `vitest.config.mts`                                                         |
| 실행 명령     | `npm test` (= `vitest run`)                                                 |
| `globals`     | **비활성** — `describe`/`test`/`expect`를 항상 명시적으로 import            |
| `environment` | `node` — DOM이 필요하면 `@/lib/dom-shim`의 `ensureDom()`을 쓰는 모듈만 해당 |
| 경로 별칭     | `@` → `./src`                                                               |
| Node          | 24.x                                                                        |
| 포매팅        | Prettier — 큰따옴표, 세미콜론, 들여쓰기 2칸, 최대 100자                     |

### 이 매뉴얼의 적용 범위

대상 선정·검증 방식·단계 중단 조건은 [AGENTS.md](../AGENTS.md)를 따른다. 이 문서는 1단계를 마치고 단위 테스트 대상으로 확정된 동작의 작성·실행·검토를 담당한다. 통합·DB·컴포넌트·E2E 검증을 이 문서의 단위 테스트로 대체하지 않는다.

---

## 2. 코드 규약

기존 테스트에서 추출한 실제 규약이다. 새 테스트는 이 모양을 따른다.

### 파일 위치와 이름

대상 파일 **바로 옆**에 `.test.ts`를 붙인다. `__tests__/` 폴더를 만들지 않는다.

```
src/lib/pagination.ts
src/lib/pagination.test.ts    ← 여기
```

### 기본 형태

```ts
import { describe, expect, test } from "vitest";

import { resolveLimit, resolveOffset } from "./pagination";

describe("resolveLimit", () => {
  test("값이 없거나 숫자가 아니면 기본값을 사용한다", () => {
    expect(resolveLimit()).toBe(20);
    expect(resolveLimit(Number.NaN, 12)).toBe(12);
  });
});
```

- vitest import를 먼저, 빈 줄, 그다음 대상 모듈 import
- 대상 모듈은 **상대 경로**(`./pagination`), 그 외 프로젝트 파일은 `@/` 별칭
- `describe`는 함수 이름 또는 도메인 개념 단위로 묶는다
- 준비/실행/확인 주석은 달지 않는다 (현재 규약)

### 테스트 이름

- **한국어**, `~한다`로 끝내는 서술형
- 동작을 적는다. 함수 이름을 반복하지 않는다 (`describe`에 이미 있음)
- **금지어**: `올바르게`, `제대로`, `정상적으로`, `잘` — 아무 정보가 없는 군더더기

```ts
// 나쁨
test("resolveLimit이 올바르게 동작한다", ...)
test("주어진 값이 최대치를 초과하는 경우에 최대치로 제한되는지 확인한다", ...)

// 좋음
test("최대치를 넘으면 상한으로 자른다", ...)
test("음수 페이지는 첫 페이지로 처리한다", ...)
```

### `test.each` — 이름 보간은 필수

**표 형태 케이스는 반드시 `%s` 또는 `$field`로 케이스를 이름에 드러낸다.** 보간이 없으면 실패했을 때 어느 케이스가 깨졌는지 알 수 없다.

```ts
// 나쁨 — 세 케이스가 전부 같은 이름으로 출력된다
test.each([caseA, caseB, caseC])("잘못된 입력을 거부한다", (input) => { ... });

// 좋음
test.each([
  ["자유게시판", "free"],
  ["INFO", "recipe_tip"],
  ["qna", "question"],
] as const)("기존 카테고리 %s를 %s로 정규화한다", (value, expected) => {
  expect(normalizePostCategory(value)).toBe(expected);
});
```

객체 배열이면 라벨을 첫 원소로 붙인다.

```ts
test.each([
  ["빈 제목", { title: "   ", content_json: CONTENT, category: "free" }],
  ["없는 카테고리", { title: "글", content_json: CONTENT, category: "notice" }],
] as const)("%s은 거부한다", (_label, input) => { ... });
```

튜플에는 `as const`를 붙여 타입을 좁힌다.

### 픽스처와 헬퍼

반복 데이터는 모듈 상단 상수로, 셋업은 파일 안 헬퍼 함수로 만든다. `beforeEach`보다 명시적 헬퍼를 선호한다.

```ts
const USER_A = "00000000-0000-4000-8000-000000000001";
const CONTENT = { root: { children: [] } };

function createClient(data: boolean | null, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}
```

---

## 3. 단언 규칙

### 반드시 구체적으로

```ts
// 금지 — 가짜 안심
expect(result).toBeDefined();
expect(() => fn(input)).not.toThrow();
expect(result.length).toBeGreaterThan(0);

// 필수 — 값을 고정한다
expect(result).toBe("/recipes?page=2#comments");
expect(result).toEqual([USER_A, USER_B]);
expect(user).toMatchObject({ name: "Alice", email: "alice@example.com" });
```

### 실패 케이스는 "왜 실패했는지"까지

`success === false`만 확인하면 **엉뚱한 이유로 실패해도 통과**한다.

```ts
// 약함
expect(postInsertSchema.safeParse(input).success).toBe(false);

// 강함
const result = postInsertSchema.safeParse(input);
expect(result.success).toBe(false);
expect(result.error?.issues[0]?.path).toEqual(["title"]);
```

에러 메시지를 고정할 때는 문자열 일치 또는 `toMatchInlineSnapshot`을 쓴다.

```ts
expect(() => collectMentionTargetIds(mentions)).toThrow(
  "한 게시글에는 최대 20명까지 멘션할 수 있습니다."
);
```

### 동작을 검증하고, 구현을 검증하지 않는다

판단 기준: **"내부를 바꿨는데 결과는 여전히 맞다면, 이 테스트가 깨지는가?"** 깨진다면 결합이 과한 것이다.

```ts
// 금지 — RPC 이름을 바꾸면 동작이 멀쩡해도 깨진다
expect(rpc).toHaveBeenCalledWith("is_current_user_admin");

// 허용 — "불필요한 DB 왕복을 하지 않는다"는 동작 계약이다
expect(rpc).not.toHaveBeenCalled();
```

스파이 호출 횟수·인자 검증은 **부작용의 유무 자체가 계약일 때만** 쓴다.

### Mocking 최소화

- **기본값은 mocking 금지.** 실제 구현으로 테스트한다.
- 함수 인자로 받는 의존성(예: `SupabaseClient`)은 가짜 객체를 만들어 넘겨도 된다. 이건 mocking이 아니라 입력값이다.
- `vi.mock`으로 모듈을 통째로 갈아끼우는 것은 §6의 예외 상황에만 허용한다.
- `jest.*`는 이 프로젝트에 존재하지 않는다. 항상 `vi.*`를 쓴다.

---

## 4. 엣지 케이스 — 빠뜨리면 미완성

AI는 happy path만 만드는 경향이 있다. **아래 항목 중 대상 함수에 해당하는 것은 전부 포함해야 작성 완료로 본다.**

| 범주        | 예시                                                 |
| ----------- | ---------------------------------------------------- |
| 빈 값       | `""`, `"   "`(공백만), `[]`, `new Map()`, `{}`       |
| 없는 값     | `null`, `undefined` — 시그니처가 허용하면 **반드시** |
| 숫자 이상값 | `0`, 음수, `NaN`, `Infinity`, 소수                   |
| 경계 ±1     | 상한이 20이면 **20과 21 둘 다**                      |
| 형식 위반   | UUID 아닌 문자열, 스키마와 다른 타입                 |
| 오류 경로   | 예외를 던지는 분기, RPC/네트워크 실패                |
| 중복        | 같은 값을 두 번 넣었을 때 중복 제거되는가            |

### 보안 함수는 "무엇이 제거되어야 하는가"를 테스트한다

`sanitizePostHtml`처럼 방어가 목적인 함수는 통과 케이스보다 **차단 케이스**가 본체다.

```ts
test("javascript: 스킴 링크는 허용하지 않는다", () => {
  expect(sanitizePostHtml('<a href="javascript:alert(1)">클릭</a>')).not.toContain("javascript:");
});

test("https가 아닌 iframe은 제거한다", () => {
  expect(sanitizePostHtml('<iframe src="http://evil.com"></iframe>')).not.toContain("evil.com");
});
```

필수 차단 목록: `<script>`, 이벤트 속성(`onerror`/`onclick`), `javascript:` 스킴, 비-https `img`/`iframe`, 허용 목록 밖 태그·속성.

---

## 5. 생성 후 검토 체크리스트

AI는 작업을 끝냈다고 보고하기 전에 이 목록을 자기 검토한다. 사람은 같은 목록으로 결과를 본다.

- [ ] **실행했는가** — `npx vitest run <파일경로>`를 실제로 돌려 통과를 확인했다. 실행하지 않고 완료 보고 금지
- [ ] `vitest`(watch)가 아니라 `vitest run`을 썼다
- [ ] `jest.*`가 없다. `vi.*`만 쓴다
- [ ] `describe`/`test`/`expect`를 명시적으로 import했다 (globals 비활성)
- [ ] `toBeDefined()`, `not.toThrow()` 같은 빈 단언이 없다
- [ ] `test.each`마다 `%s`/`$field` 보간이 있다
- [ ] 내부 호출 이름을 단언하지 않았다 (§3)
- [ ] §4의 해당 엣지 케이스를 모두 넣었다
- [ ] 테스트 이름에 `올바르게`/`제대로`/`정상적으로`가 없다
- [ ] 한 테스트가 한 가지를 검증한다 (3가지를 몰아넣지 않았다)
- [ ] 새 mock을 썼다면 정리(cleanup)가 되어 있다
- [ ] Prettier 규칙(큰따옴표, 세미콜론, 100자)에 맞다

### 일부러 깨뜨려 보기

새 테스트가 진짜로 감시하고 있는지 확인하는 방법이다. **대상 함수를 잠깐 망가뜨려 테스트가 빨간불이 되는지 본 뒤 되돌린다.** 망가뜨렸는데도 초록불이면 그 테스트는 아무것도 지키지 않는 것이다.

---

## 6. 알려진 함정

### `server-only` import

`import "server-only"`가 있는 파일은 Vitest가 그 이름을 해석하지 못한다. Next.js가 빌드 시점에만 처리하는 가상 모듈이고 실제 패키지가 설치돼 있지 않다.

```ts
vi.mock("server-only", () => ({}));
```

**문자열 경로 형태가 맞다.** `vi.mock(import("server-only"))` 형태로 "개선"하지 마라 — 존재하지 않는 모듈이라 실패한다.

해당 파일: `src/domain/post/content.ts`, `src/lib/auth/content-permissions.ts` 등.

### 환경변수를 모듈 로드 시점에 읽는 모듈

`src/lib/storage/paths.ts`는 최상위에서 `process.env`를 읽는다. `vi.stubEnv` 후 **`vi.resetModules()` + 동적 import**를 해야 반영된다.

```ts
async function loadPaths(bucket = "food-images") {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", bucket);
  vi.resetModules();
  return import("./paths");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
```

### DOM이 필요한 모듈

`environment: "node"`지만 `content.ts`는 `ensureDom()`으로 jsdom을 직접 띄운다. 테스트에서 `environment`를 바꾸지 말고 그대로 쓴다. 첫 로드가 느리므로 `beforeAll`에 타임아웃 여유를 준다.

```ts
beforeAll(async () => {
  /* ... */
}, 15_000);
```

### export되지 않은 함수

`content.ts`의 `getYouTubeVideoId`처럼 내부 함수는 직접 부를 수 없다. **테스트를 위해 `export`를 추가하지 마라.** 그 함수를 사용하는 공개 함수(`enhanceStandaloneYouTubeLinks`)를 통해 검증한다.

---

## 7. 복사해서 쓰는 프롬프트

### 새 테스트 작성

```
<파일경로>의 <함수명>에 대한 단위 테스트를 작성해줘.

읽을 것:
- AGENTS.md (대상 선정 및 2단계 시작 조건)
- docs/ai-test-authoring-manual.md (이 저장소의 테스트 규약)
- 대상 소스 파일 전체
- src/lib/pagination.test.ts (스타일 기준)
- vitest.config.mts

검증할 규칙:
- (여기에 도메인 규칙을 직접 적는다. 예: "멘션은 글당 최대 20명", "간식에는 분식도 포함")

제약:
- 모듈 mocking 금지. 실제 구현으로 테스트할 것
- 매뉴얼 §4의 해당 엣지 케이스를 전부 포함할 것
- 작성 후 `npx vitest run <파일경로>`를 실행해 통과를 확인하고, 출력을 보여줄 것
```

**"검증할 규칙"을 비워두지 마라.** 이 칸이 이 프롬프트에서 가장 중요하다. `expect` 타이핑은 AI가 하지만 "무엇이 참이어야 하는가"는 프로젝트를 아는 사람만 정할 수 있다. 비워두면 AI가 코드를 그대로 옮겨 적은, 아무 버그도 못 잡는 테스트가 나온다.

### 버그 회귀 테스트 (가장 값어치 있는 테스트)

```
<현상>이라는 버그를 발견했다.

1. 먼저 이 버그를 재현하는 테스트를 작성하고 실행해서 **실패하는 것**을 보여줘
2. 그다음 원인을 고쳐줘
3. 같은 테스트가 통과하는 것을 보여줘

고치기 전에 실패를 먼저 확인하는 순서를 지킬 것.
```

### 기존 테스트 검토

```
<파일경로>의 테스트를 docs/ai-test-authoring-manual.md §5 체크리스트로 검토해줘.
항목별 통과/실패와, 실패한 항목의 구체적 수정안을 제시할 것.
추측하지 말고 `npx vitest run`을 실제로 실행해서 확인할 것.
```

---

## 8. 이 문서를 갱신하는 시점

- 새 테스트 규약이 생기거나 기존 규약이 바뀔 때
- 새로운 함정을 발견했을 때 (§6에 추가)
- Playwright를 도입할 때 — E2E는 별도 매뉴얼로 분리한다

## 9. 참고

- [Vitest — Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)
- [Vitest API Reference](https://vitest.dev/api/)
- `docs/p1-e2e-test-guide.md` — 수동 E2E 체크리스트
