import { ShoppingBag } from "lucide-react";

import type { RecipeIngredient } from "../types";

type Props = {
  ingredients: RecipeIngredient[] | null | undefined;
};

const COUPANG_SEARCH_BASE_URL = "https://www.coupang.com/np/search?q=";

function buildCoupangSearchUrl(keyword: string): string {
  return `${COUPANG_SEARCH_BASE_URL}${encodeURIComponent(keyword.trim())}`;
}

function ingredientQuantity(item: RecipeIngredient): string {
  const unitText = item.unit === "__custom__" ? item.unitCustom : item.unit;
  return item.amount ? `${item.amount}${unitText ?? ""}` : (unitText ?? "");
}

function ingredientInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "재";
}

export default function RecipeIngredientsPanel({ ingredients }: Props) {
  const items = ingredients ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
        등록된 재료가 없습니다.
      </div>
    );
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const ingredientName = item.name?.trim() ?? "";
        const hasName = ingredientName.length > 0;
        const qty = ingredientQuantity(item);

        return (
          <li
            key={`${item.name}-${index}`}
            className="flex min-h-[96px] items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-emerald-50 text-lg font-black text-emerald-700">
              {ingredientInitial(ingredientName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-bold text-zinc-950">{ingredientName || "재료"}</p>
              {qty ? <p className="mt-2 text-sm font-medium text-zinc-500">{qty}</p> : null}
            </div>

            {hasName ? (
              <a
                href={buildCoupangSearchUrl(ingredientName)}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                구매
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
