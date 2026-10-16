import { ArrowRight, ChefHat, Lightbulb, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_WRITING_QUESTIONS } from "@/features/writing-assistant/schema";
import { WRITING_ASSISTANT_COPY } from "./copy";
import type { WritingAssistantIntroProps } from "./types";

const STEPS = [
  { title: "생각나는 대로 메모하기", description: "문장이 아니어도 괜찮아요." },
  {
    title: "질문에 답하며 구체화하기",
    description: `최대 ${MAX_WRITING_QUESTIONS}번 묻고, 모르면 AI에게 맡겨도 돼요.`,
  },
  { title: "초안 확인 후 폼에 반영", description: "저장은 검토한 뒤 직접 해요." },
];

export function WritingAssistantIntro({ kind, pending, onUseExample }: WritingAssistantIntroProps) {
  const copy = WRITING_ASSISTANT_COPY[kind];
  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
          <ChefHat className="size-4" aria-hidden="true" />
          {copy.label} 작성
        </p>
        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight">
          떠오르는 생각부터
          <br />
          편하게 적어주세요.
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.label}의 구성을 함께 잡고, 질문으로 조금씩 구체화해 볼게요.
        </p>
        {copy.formNote ? (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs leading-5 text-green-900 dark:bg-green-950/40 dark:text-green-200">
            {copy.formNote}
          </p>
        ) : null}
      </div>

      <ol className="space-y-3.5 rounded-xl bg-muted/50 p-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-green-700 ring-1 ring-border dark:text-green-400">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium leading-5">{step.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        onClick={() => onUseExample(copy.example)}
        disabled={pending}
        className="group h-auto w-full flex-col items-start gap-2 whitespace-normal rounded-xl border-dashed p-4 text-left font-normal hover:border-green-300 hover:bg-green-50/50 dark:hover:border-green-800 dark:hover:bg-green-950/30"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
          <Lightbulb className="size-3.5" aria-hidden="true" />
          이렇게 시작해 보세요
        </span>
        <span className="text-sm leading-6">{copy.example}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-green-700 dark:group-hover:text-green-400">
          예시 넣기 <ArrowRight className="size-3" aria-hidden="true" />
        </span>
      </Button>

      <p className="flex items-start gap-1.5 text-[11px] leading-4 text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        메모·답변과 폼 내용을 AI에 전달해요. 이미지는 보내지 않아요.
      </p>
    </div>
  );
}
