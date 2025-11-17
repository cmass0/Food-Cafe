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
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <Textarea
        placeholder="댓글을 입력해주세요."
        rows={4}
        value={content}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submitting || !content.trim()}>
          {submitting ? "작성 중..." : "댓글 작성"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
