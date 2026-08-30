"use client";

import { Check, Link2 } from "lucide-react";
import Script from "next/script";
import { useState, type ReactNode } from "react";

import ErrorModal from "@/lib/ui/errormodal";

type contentinfo = {
  description?: string | null;
  title: string;
};

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (payload: {
          objectType: "feed";
          content: {
            title: string;
            description?: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
        }) => void;
      };
    };
  }
}

type Props = {
  contentinfo: contentinfo;
  imageUrl: string;
  url: string;
  label?: string;
  className?: string;
  children?: ReactNode;
};

const KAKAO_SHARE_BUTTON_IMAGE =
  "https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png";

type ShareErrorKind = "sdk-unavailable" | "share-failed";
type CopyStatus = "idle" | "copied" | "failed";

const SHARE_ERROR_CONTENT: Record<ShareErrorKind, { title: string; description: string }> = {
  "sdk-unavailable": {
    title: "카카오 공유를 사용할 수 없습니다",
    description: "공유 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
  "share-failed": {
    title: "카카오톡 공유에 실패했습니다",
    description: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  },
};

export default function KakaoShareButton({
  contentinfo,
  imageUrl,
  url,
  label = "카카오톡 공유하기",
  className,
  children,
}: Props) {
  const [shareError, setShareError] = useState<ShareErrorKind | null>(null);
  const [sdkLoadFailed, setSdkLoadFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const initKakao = () => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) {
      console.error("kakao_share: Missing NEXT_PUBLIC_KAKAO_JS_KEY");
      return false;
    }
    if (!window.Kakao) {
      console.error("kakao_share: SDK not loaded");
      return false;
    }
    try {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(key);
      }
      return true;
    } catch (error) {
      console.error("kakao_share: SDK initialization failed", error);
      return false;
    }
  };

  const share = () => {
    if (!imageUrl || !url) {
      setShareError("share-failed");
      return;
    }
    if (sdkLoadFailed || !initKakao()) {
      setShareError("sdk-unavailable");
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: contentinfo.title,
          description: contentinfo.description ?? "",
          imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
      });
    } catch (error) {
      console.error("kakao_share: Share request failed", error);
      setShareError("share-failed");
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
    } catch (error) {
      console.error("kakao_share: URL copy failed", error);
      setCopyStatus("failed");
    }
  };

  const closeErrorModal = () => {
    setShareError(null);
    setCopyStatus("idle");
  };

  const isReady = Boolean(imageUrl && url);
  const errorContent = shareError ? SHARE_ERROR_CONTENT[shareError] : null;

  return (
    <>
      <ErrorModal
        open={shareError !== null}
        onOpenChange={(open) => {
          if (!open) closeErrorModal();
        }}
        title={errorContent?.title ?? "공유 오류"}
        description={errorContent?.description ?? "공유 기능을 사용할 수 없습니다."}
        secondaryAction={{
          label:
            copyStatus === "copied"
              ? "복사 완료"
              : copyStatus === "failed"
                ? "복사 실패"
                : "URL 복사",
          onClick: copyShareUrl,
          icon:
            copyStatus === "copied" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            ),
          disabled: !url || copyStatus === "copied",
        }}
      />
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js"
        integrity="sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkLoadFailed(!initKakao());
        }}
        onError={(error) => {
          console.error("kakao_share: SDK script failed to load", error);
          setSdkLoadFailed(true);
        }}
      />
      <button
        type="button"
        onClick={share}
        className={className}
        disabled={!isReady}
        aria-label={label}
      >
        {children ?? <img src={KAKAO_SHARE_BUTTON_IMAGE} alt={label} className="block" />}
      </button>
    </>
  );
}
