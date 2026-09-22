import { ArrowUp, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RecommendComposerProps } from "./types";

export function RecommendComposer({
  value,
  disabled = false,
  isLoading = false,
  onChange,
  onSubmit,
}: RecommendComposerProps) {
  const cannotSubmit = disabled || isLoading || value.trim().length === 0;

  return (
    <form onSubmit={onSubmit} className="relative border-t border-zinc-200 pt-4">
      <Textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="원하는 재료나 메뉴를 말해주세요."
        aria-label="AI 추천 메시지"
        className="min-h-20 resize-none rounded-xl border-zinc-300 bg-white pr-16"
      />
      <Button
        type="submit"
        size="icon"
        disabled={cannotSubmit}
        aria-label="메시지 보내기"
        className="absolute bottom-3 right-3 bg-[#34783f] text-white hover:bg-[#2f6f39]"
      >
        {isLoading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowUp className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
