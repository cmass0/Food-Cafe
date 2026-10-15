import { MAX_COMBO_ITEMS } from "@/domain/combo/schema";
import type { ComboFormValues } from "@/domain/combo/types";
import type { ComboWritingDraft } from "./types";

type FormItem = ComboFormValues["items"][number];

// 초안의 조합 항목을 지금 폼 항목과 합친다.
// - 레시피는 폼에 불러온 원본 행(제목·설명·이미지)을 그대로 쓰고, 초안에 없어도 남긴다.
//   답을 받은 뒤 폼에서 지운 레시피가 초안에 있으면 초안 자리에 다시 넣는다. 조리 단계가 그 레시피를 함께 쓰기 때문이다.
// - 상품은 초안을 따르고, 이름이 같은 폼 상품에 올려 둔 이미지를 이어받는다.
// removed는 반영하면 폼에서 빠지는 상품, restored는 다시 넣는 레시피 이름이다. 반영 확인창에 보여준다.
export function mergeComboDraftItems(current: FormItem[], draft: ComboWritingDraft["items"]) {
  const used = new Set<FormItem>();
  const entries: { item: FormItem; row?: FormItem }[] = [];
  const restored: string[] = [];
  for (const item of draft) {
    const row = current.find(
      (entry) =>
        !used.has(entry) &&
        (item.type === "recipe"
          ? entry.type === "recipe" && entry.recipeid === item.recipeid
          : entry.type === "product" && entry.productName === item.productName)
    );
    if (row) used.add(row);
    // 사진이 없으면 undefined가 아니라 null로 둔다. 폼은 비어 있는 칸을 처음 불러온 기본값으로
    // 채우므로, undefined면 수정 화면에서 같은 자리에 있던 예전 항목의 사진이 붙는다.
    if (item.type === "product")
      entries.push({ item: { ...item, image: row?.image ?? null }, row });
    else if (row) entries.push({ item: row, row });
    else {
      // 지운 행의 사진·설명은 남아 있지 않다. 위와 같은 이유로 빈 값을 명시한다.
      entries.push({
        item: {
          type: "recipe",
          recipeid: item.recipeid,
          title: item.title,
          summary: "",
          image: null,
        },
      });
      restored.push(item.title);
    }
  }
  for (const row of current) {
    if (row.type === "recipe" && row.recipeid.trim() !== "" && !used.has(row)) {
      used.add(row);
      entries.push({ item: row, row });
    }
  }
  // 상한을 넘으면 상품을 뒤에서부터 뺀다. 레시피는 사용자가 고른 것이라 빼지 않는다.
  for (let index = entries.length - 1; entries.length > MAX_COMBO_ITEMS && index >= 0; index--) {
    const entry = entries[index];
    if (entry?.item.type !== "product") continue;
    if (entry.row) used.delete(entry.row);
    entries.splice(index, 1);
  }
  const removed = current.flatMap((row) =>
    row.type === "product" && row.productName.trim() !== "" && !used.has(row)
      ? [row.image ? `${row.productName} (사진 포함)` : row.productName]
      : []
  );
  return { items: entries.map((entry) => entry.item), removed, restored };
}
