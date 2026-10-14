import type { ReactNode } from "react";
import { Clock, Gauge, Lightbulb, TriangleAlert, Users, Utensils } from "lucide-react";
import type { WritingDraftPreviewProps } from "./types";

function DraftSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={`초안 ${title}`} className="space-y-2.5">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
        {title}
        {count !== undefined ? (
          <span className="text-xs font-medium text-muted-foreground">{count}</span>
        ) : null}
      </h4>
      {children}
    </section>
  );
}

function ChipList({ items, prefix = "" }: { items: string[]; prefix?: string }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">없음</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li key={index} className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {prefix}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WritingDraftPreview({ response }: WritingDraftPreviewProps) {
  const draft = response.draft;
  if (!draft) return null;
  const meta = [
    { icon: Clock, label: `약 ${draft.time_minutes}분` },
    { icon: Gauge, label: draft.difficulty },
    ...(response.kind === "recipe" && response.draft
      ? [
          { icon: Users, label: `${response.draft.servings}인분` },
          { icon: Utensils, label: response.draft.category },
        ]
      : []),
  ];

  return (
    <article className="space-y-6 break-words">
      <header className="space-y-2">
        <p className="text-lg font-semibold leading-snug tracking-tight">{draft.title}</p>
        {draft.summary ? (
          <p className="text-sm leading-6 text-muted-foreground">{draft.summary}</p>
        ) : null}
        <ul className="flex flex-wrap gap-1.5 pt-1">
          {meta.map(({ icon: Icon, label }, index) => (
            <li
              key={index}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium"
            >
              <Icon className="size-3.5 text-green-700 dark:text-green-400" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </header>

      {response.kind === "recipe" && response.draft ? (
        <DraftSection title="재료" count={response.draft.ingredients.length}>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {response.draft.ingredients.map((item, index) => (
              <li
                key={index}
                className="flex items-baseline justify-between gap-4 px-3.5 py-2 text-sm"
              >
                <span className="min-w-0">{item.name}</span>
                <span className="shrink-0 text-right text-muted-foreground tabular-nums">
                  {item.amount} {item.unit === "custom" ? item.unitCustom : item.unit}
                </span>
              </li>
            ))}
          </ul>
        </DraftSection>
      ) : response.kind === "combo" && response.draft ? (
        <DraftSection title="조합 구성" count={response.draft.items.length}>
          <ul className="space-y-2">
            {response.draft.items.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-border px-3.5 py-3"
              >
                <span
                  className={
                    item.type === "recipe"
                      ? "mt-0.5 shrink-0 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "mt-0.5 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                  }
                >
                  {item.type === "recipe" ? "레시피" : "상품"}
                </span>
                <div className="min-w-0 text-sm leading-6">
                  <p className="font-medium">
                    {item.type === "recipe" ? item.title : item.productName}
                  </p>
                  {item.type === "product" && item.summary ? (
                    <p className="text-xs leading-5 text-muted-foreground">{item.summary}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </DraftSection>
      ) : null}

      <DraftSection title="조리 순서" count={draft.steps.length}>
        <ol className="space-y-3">
          {draft.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm leading-6">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <p className="min-w-0">{step.description}</p>
            </li>
          ))}
        </ol>
      </DraftSection>

      <div className="grid grid-cols-2 gap-4">
        <DraftSection title="도구">
          <ChipList items={draft.tools} />
        </DraftSection>
        <DraftSection title="태그">
          <ChipList items={draft.tags} prefix="#" />
        </DraftSection>
      </div>

      {response.kind === "recipe" && response.draft?.chef_tip ? (
        <section
          aria-label="초안 셰프 팁"
          className="flex gap-3 rounded-xl bg-muted/60 p-4 text-sm leading-6"
        >
          <Lightbulb
            className="mt-0.5 size-4 shrink-0 text-green-700 dark:text-green-400"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold">셰프 팁</h4>
            <p className="mt-0.5">{response.draft.chef_tip}</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold">
          <TriangleAlert className="size-3.5 text-amber-600" aria-hidden="true" />
          AI 제안 · 저장 전 확인
        </h4>
        <p className="mt-1.5 text-xs leading-5 opacity-80">
          직접 알려주지 않은 분량·시간·도구 등은 AI의 추정입니다. 실제 조리 조건에 맞게 검토해
          주세요.
        </p>
        {response.suggestions.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-amber-200/70 pt-3 text-xs leading-5 dark:border-amber-900">
            {response.suggestions.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span
                  className="mt-[7px] size-1 shrink-0 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </article>
  );
}
