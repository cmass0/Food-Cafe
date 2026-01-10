"use client";

import Script from "next/script";

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
};

const KAKAO_SHARE_BUTTON_IMAGE =
  "https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png";

export default function KakaoShareButton({
  contentinfo,
  imageUrl,
  url,
  label = "카카오톡 공유하기",
  className,
}: Props) {
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
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
    return true;
  };

  const share = () => {
    if (!imageUrl || !url) return;
    if (!initKakao()) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: contentinfo.title,
        description: contentinfo.description ?? "",
        imageUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
    });
  };

  const isReady = Boolean(imageUrl && url);

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js"
        integrity="sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={initKakao}
      />
      <button
        type="button"
        onClick={share}
        className={className}
        disabled={!isReady}
        aria-label={label}
      >
        <img src={KAKAO_SHARE_BUTTON_IMAGE} alt={label} className="block" />
      </button>
    </>
  );
}
