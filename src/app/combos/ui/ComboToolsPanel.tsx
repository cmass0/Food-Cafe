import { Wrench } from "lucide-react";

type Props = {
  tools: string[] | null | undefined;
};

const COUPANG_SEARCH_BASE_URL = "https://www.coupang.com/np/search?q=";

function buildCoupangSearchUrl(keyword: string): string {
  return `${COUPANG_SEARCH_BASE_URL}${encodeURIComponent(keyword.trim())}`;
}

export default function ComboToolsPanel({ tools }: Props) {
  const items = tools?.map((tool) => tool.trim()).filter(Boolean) ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5 border-t border-zinc-200 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-xl font-black text-zinc-950">
          <Wrench className="h-5 w-5 text-[#15933d]" />
          사용 도구
        </h2>
        <span className="text-sm font-medium text-zinc-500">총 {items.length}개</span>
      </div>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex min-h-[76px] items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1 truncate font-bold text-zinc-950">{item}</span>
            <a
              href={buildCoupangSearchUrl(item)}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              구매
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
