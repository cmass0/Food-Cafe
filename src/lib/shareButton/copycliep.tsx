"use client";

import { ClipboardCopy } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  currentUrl: string;
  className?: string;
  children?: ReactNode;
};

export function CopyClipButton({ currentUrl, className, children }: Props) {
  const copyClip = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert("URL이 복사되었습니다.");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      className={
        className ??
        "inline-flex h-[69px] w-[68px] items-center justify-center rounded-md border border-border/70 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
      }
      type="button"
      onClick={copyClip}
      aria-label="URL 복사"
      title="URL 복사"
    >
      {children ?? <ClipboardCopy className="h-6 w-6" />}
    </button>
  );
}
