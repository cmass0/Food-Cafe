"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import ErrorModal from "@/components/status/ErrorModal";

type Props = {
  currentUrl: string;
  className?: string;
  children?: ReactNode;
  // 무엇을 복사하는지. 버튼 설명과 실패 안내에 쓴다(예: "레시피 ID").
  label?: string;
};

export function CopyClipButton({ currentUrl, className, children, label = "URL" }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const copyClip = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);

      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
      resetTimer.current = window.setTimeout(() => {
        setCopied(false);
        resetTimer.current = null;
      }, 1800);
    } catch (error) {
      console.error("share: URL copy failed", error);
      setCopyFailed(true);
    }
  };

  return (
    <>
      <ErrorModal
        open={copyFailed}
        onOpenChange={setCopyFailed}
        title={`${label} 복사에 실패했습니다`}
        description="브라우저가 클립보드 사용을 허용하지 않았습니다. 권한을 확인한 뒤 다시 시도해 주세요."
      />
      <button
        className={
          className ??
          "inline-flex h-[69px] w-[68px] items-center justify-center rounded-md border border-border/70 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        }
        type="button"
        onClick={copyClip}
        disabled={copied}
        aria-label={copied ? `${label} 복사 완료` : `${label} 복사`}
        aria-live="polite"
        title={copied ? "복사 완료" : `${label} 복사`}
      >
        {copied ? (
          <>
            <Check className="h-5 w-5" aria-hidden="true" />
            복사 완료
          </>
        ) : (
          children ?? <ClipboardCopy className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
