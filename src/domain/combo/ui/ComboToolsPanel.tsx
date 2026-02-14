type Props = {
  tools: string[] | null | undefined;
};

const COUPANG_SEARCH_BASE_URL = "https://www.coupang.com/np/search?q=";

function buildCoupangSearchUrl(keyword: string): string {
  return `${COUPANG_SEARCH_BASE_URL}${encodeURIComponent(keyword.trim())}`;
}

export default function ComboToolsPanel({ tools }: Props) {
  const items = tools ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border border-border/70 bg-white px-5 py-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">사용 도구</h3>
        <span className="text-xs text-muted-foreground">총 {items.length}개</span>
      </div>

      <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const toolName = item?.trim() ?? "";
          const hasName = toolName.length > 0;

          return (
            <li
              key={`${item}-${idx}`}
              className="flex h-full flex-col gap-2.5 border border-border/60 bg-slate-50 px-3 py-2"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate">{item}</span>
                {hasName ? (
                  <div className="flex justify-end">
                    <a
                      href={buildCoupangSearchUrl(toolName)}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      구매
                    </a>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
