// 화면 배율이 2.5배 이상인 폰은 사진을 배율 2배 선명도까지만 받게 next/image의 sizes를 만든다.
// 브라우저는 sizes × 화면 배율로 받을 사진 폭을 고른다. 3배 화면에서 3배 사진은 2배와 눈으로
// 구분하기 어려운데 용량은 2배 가까이 커서, 느린 회선에서 첫 화면 사진이 늦게 뜬다.
const HIGH_DENSITY = "(min-resolution: 2.5dppx)";

// "(max-width: 640px) 100vw" → 조건 "(max-width: 640px)", 폭 "100vw". 조건 없는 "25vw"도 받는다.
const ENTRY = /^(?:(.*\))\s+)?(\S+)$/;

/**
 * sizes의 각 항목 앞에 "고배율 화면이면 같은 폭의 2/3로 계산한다"는 항목을 덧붙인다.
 * 3배 화면은 2배, 2.625배 화면은 1.75배 선명도의 사진을 받는다. 2배 이하 화면은 그대로다.
 * 해석할 수 없는 항목은 바꾸지 않고 남긴다.
 */
export function capImageDensity(sizes: string): string {
  return sizes
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const match = ENTRY.exec(entry);
      if (!match) return [entry];
      const [, condition, width] = match;
      const highDensity = condition ? `${condition} and ${HIGH_DENSITY}` : HIGH_DENSITY;
      return [`${highDensity} calc(${width} * 2 / 3)`, entry];
    })
    .join(", ");
}
