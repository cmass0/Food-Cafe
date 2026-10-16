import { MAX_COMBO_ITEMS } from "@/domain/combo/schema";
import type { ComboFormValues } from "@/domain/combo/types";
import type { ComboWritingDraft } from "./types";

type FormItem = ComboFormValues["items"][number];
type DraftItem = ComboWritingDraft["items"][number];

// 서버는 레시피 ID를 DB처럼 소문자로 돌려주고, 폼에는 사용자가 붙여 넣은 대문자가 남아 있을 수 있다.
// 상품은 이름 앞뒤 공백만 다르면 같은 상품으로 본다.
function isSameItem(row: FormItem, item: DraftItem) {
  return item.type === "recipe"
    ? row.type === "recipe" && row.recipeid.toLowerCase() === item.recipeid.toLowerCase()
    : row.type === "product" && row.productName.trim() === item.productName.trim();
}

// 비어 있는 칸(레시피 ID나 상품 이름이 없는 칸)은 반영할 때 남기지 않는다.
function isFilled(row: FormItem) {
  return row.type === "recipe" ? row.recipeid.trim() !== "" : row.productName.trim() !== "";
}

// 초안의 조합 항목을 지금 폼 항목과 합친다. 사용자가 폼에 넣은 레시피·상품은 AI가 빼거나 바꾸지 못한다.
// - 폼에 있는 레시피·상품은 폼의 행(이름·설명·사진)을 그대로 쓰고, 초안에 없어도 끝에 남긴다.
// - 답을 받은 뒤 폼에서 지운 레시피가 초안에 있으면 초안 자리에 다시 넣는다. 조리 단계가 그 레시피를 함께 쓰기 때문이다.
// - 초안에만 있는 상품은 AI가 새로 제안한 것이라 사진 없이 더하고, 상한을 넘으면 이것부터 뺀다.
// restored는 다시 넣는 레시피 이름이다. 반영 확인창에 보여준다.
export function mergeComboDraftItems(current: FormItem[], draft: DraftItem[]) {
  const used = new Set<FormItem>();
  const entries: { item: FormItem; suggested: boolean }[] = [];
  const restored: string[] = [];
  for (const item of draft) {
    const row = current.find((entry) => !used.has(entry) && isSameItem(entry, item));
    if (row) {
      used.add(row);
      entries.push({ item: row, suggested: false });
    } else if (item.type === "recipe") {
      // 사진·설명이 없으면 undefined가 아니라 빈 값으로 둔다. 폼은 비어 있는 칸을 처음 불러온 기본값으로
      // 채우므로, undefined면 수정 화면에서 같은 자리에 있던 예전 항목의 값이 붙는다.
      entries.push({
        item: {
          type: "recipe",
          recipeid: item.recipeid,
          title: item.title,
          summary: "",
          image: null,
        },
        suggested: false,
      });
      restored.push(item.title);
    } else {
      entries.push({ item: { ...item, image: null }, suggested: true });
    }
  }
  for (const row of current) {
    if (!used.has(row) && isFilled(row)) entries.push({ item: row, suggested: false });
  }
  for (let index = entries.length - 1; entries.length > MAX_COMBO_ITEMS && index >= 0; index--) {
    if (entries[index]?.suggested) entries.splice(index, 1);
  }
  return { items: entries.map((entry) => entry.item), restored };
}
