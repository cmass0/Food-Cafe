// Next는 페이지와 API 라우트를 서로 다른 묶음으로 빌드해서, 같은 파일이라도 모듈이 묶음마다 따로 만들어진다.
// 모듈에 둔 변수는 묶음마다 하나씩 생기므로, 서버 프로세스에 하나만 있어야 하는 것(공유 캐시, 요청 창구)은
// 전역 객체에 이름을 붙여 한 번만 만들어 둔다.
export function processSingleton<T>(name: string, create: () => T): T {
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  const key = Symbol.for(`food-cafe:${name}`);
  return (store[key] ??= create());
}
