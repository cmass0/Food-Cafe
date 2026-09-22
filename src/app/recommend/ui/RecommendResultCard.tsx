import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RecommendResultCardProps } from "./types";

export function RecommendResultCard({ item }: RecommendResultCardProps) {
  const href = item.sourceType === "recipe" ? `/recipes/${item.id}` : `/combos/${item.id}`;
  const label = item.sourceType === "recipe" ? "레시피" : "조합";

  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#438e4d] hover:shadow-sm"
    >
      <Badge variant="outline" className="mb-2 border-emerald-200 text-[#34783f]">
        {label}
      </Badge>
      <h3 className="font-bold text-zinc-950">{item.title}</h3>
      {item.summary ? (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{item.summary}</p>
      ) : null}
    </Link>
  );
}
