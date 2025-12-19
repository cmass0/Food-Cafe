import type { RecipeIngredient } from "../types";

type Props = {
  ingredients: RecipeIngredient[] | null | undefined;
};

export default function RecipeIngredientsPanel({ ingredients }: Props) {
  const items = ingredients ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border border-border/70 bg-white px-5 py-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">재료</h3>
        <span className="text-xs text-muted-foreground">{items.length}개</span>
      </div>
      <ul className="space-y-2 text-sm text-slate-700">
        {items.map((item, idx) => {
          const unitText = item.unit === "__custom__" ? item.unitCustom : item.unit;
          const qty = item.amount ? `${item.amount}${unitText ?? ""}` : unitText ?? "";
          return (
            <li
              key={`${item.name}-${idx}`}
              className="flex items-center justify-between border border-border/60 bg-slate-50 px-3 py-2"
            >
              <span>{item.name}</span>
              {qty ? <span className="text-slate-500">{qty}</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
