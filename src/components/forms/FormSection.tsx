import { useId, type ReactNode } from "react";

// 작성 화면 맨 위 제목. 레시피·조합 작성/수정 화면이 같은 모양을 쓴다.
export function FormPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6 space-y-2">
      <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  );
}

type FormSectionProps = {
  step: number;
  title: string;
  description?: ReactNode;
  // 제목 오른쪽에 두는 보조 정보(개수, "선택" 등)
  aside?: ReactNode;
  children: ReactNode;
};

// 작성 폼의 한 단계. 번호·제목·설명을 같은 모양으로 보여준다.
export function FormSection({ step, title, description, aside, children }: FormSectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white"
          >
            {step}
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="text-lg font-bold leading-7 tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {aside ? (
          <div className="shrink-0 pt-1.5 text-xs font-medium tabular-nums text-muted-foreground">
            {aside}
          </div>
        ) : null}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

// 입력하지 않아도 되는 칸의 이름 옆에 붙인다.
export function OptionalMark() {
  return <span className="ml-1.5 text-xs font-normal text-muted-foreground">선택</span>;
}
