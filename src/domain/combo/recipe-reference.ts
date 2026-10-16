// 조합 레시피 칸에 넣은 레시피 ID나 레시피 링크에서 ID 자리를 꺼낸다.
// 링크는 쿼리·해시를 떼고 마지막 경로 조각을 쓴다. ID 형식 검사는 comboRecipeIdSchema가 한다.
export function parseRecipeReference(input: string) {
  const path = input.trim().split(/[?#]/)[0] ?? "";
  const parts = path.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}
