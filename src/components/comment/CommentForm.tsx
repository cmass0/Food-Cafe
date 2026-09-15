"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  content: string;
  submitting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommentForm({ content, submitting, error, onChange, onSubmit }: CommentFormProps) {
  const maxLength = 1000;

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="댓글을 입력해주세요."
        rows={4}
        maxLength={maxLength}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 resize-y rounded-lg border-zinc-300 px-4 py-3 text-sm shadow-none focus-visible:border-[#15933d] focus-visible:ring-[#15933d]/20"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-zinc-500">
          {content.length} / {maxLength}
        </span>
        <Button
          onClick={onSubmit}
          disabled={submitting || !content.trim()}
          className="bg-[#34783f] px-5 font-bold text-white hover:bg-[#2f6f39]"
        >
          {submitting ? "작성 중..." : "댓글 작성"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
