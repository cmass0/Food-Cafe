// 화면 배율이 높은 폰은 사진을 배율 2배 선명도 안팎까지만 받게 next/image의 sizes를 만든다.
// 브라우저는 sizes × 화면 배율로 받을 사진 폭을 고른다. 3배 화면에서 3배 사진은 2배와 눈으로
// 구분하기 어려운데 용량은 2배 가까이 커서, 느린 회선에서 첫 화면 사진이 늦게 뜬다.
// 배율 구간마다 폭을 줄이는 비율이 다르다. 브라우저는 앞에서부터 맞는 항목을 쓰므로 높은 배율을 먼저 둔다.
const DENSITY_CAPS = [
  // 3.5배 이상(4배 등): 절반 → 4배 화면에서 2배, 3.5배 화면에서 1.75배
  { condition: "(min-resolution: 3.5dppx)", scale: "1 / 2" },
  // 2.5배 이상(2.625~3배): 2/3 → 3배 화면에서 2배, 2.625배 화면에서 1.75배
  { condition: "(min-resolution: 2.5dppx)", scale: "2 / 3" },
] as const;

// "(max-width: 640px) 100vw" → 조건 "(max-width: 640px)", 폭 "100vw". 조건 없는 "25vw"도 받는다.
const ENTRY = /^(?:(.*\))\s+)?(\S+)$/;

// 괄호 밖의 쉼표로만 항목을 나눈다. min(100vw, 500px)처럼 함수 안의 쉼표는 항목을 가르지 않는다.
function splitEntries(sizes: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < sizes.length; index += 1) {
    const char = sizes[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === "," && depth === 0) {
      entries.push(sizes.slice(start, index));
      start = index + 1;
    }
  }
  entries.push(sizes.slice(start));
  return entries.map((entry) => entry.trim()).filter(Boolean);
}

/**
 * sizes의 각 항목 앞에 "고배율 화면이면 같은 폭을 줄여 계산한다"는 항목을 배율 구간별로 덧붙인다.
 * 2배 이하 화면은 원래 항목을 그대로 쓴다. 해석할 수 없는 항목은 바꾸지 않고 남긴다.
 */
export function capImageDensity(sizes: string): string {
  return splitEntries(sizes)
    .flatMap((entry) => {
      const match = ENTRY.exec(entry);
      if (!match) return [entry];
      const [, condition, width] = match;
      const capped = DENSITY_CAPS.map(({ condition: density, scale }) => {
        const media = condition ? `${condition} and ${density}` : density;
        return `${media} calc(${width} * ${scale})`;
      });
      return [...capped, entry];
    })
    .join(", ");
}
