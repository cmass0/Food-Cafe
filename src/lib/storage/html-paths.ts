import sanitizeHtml from "sanitize-html";

import { managedStoragePathFromValue } from "./paths";

/**
 * HTML의 `<img src>` 중 우리 Storage 파일을 가리키는 것을 상대 경로로 모은다.
 * 게시글 본문 HTML은 브라우저가 만들어 보내므로 JSON에 없는 이미지가 들어 있을 수 있다.
 * 사용 중인 파일을 셀 때 HTML도 함께 봐야, 정리 작업이 화면에 보이는 이미지를 지우지 않는다.
 * 직접 쓴 HTML(따옴표 없는 속성 등)도 읽도록 정규식이 아닌 HTML 파서로 읽는다.
 */
export function managedPathsFromHtml(html: unknown): Set<string> {
  const paths = new Set<string>();
  if (typeof html !== "string" || !html) return paths;

  sanitizeHtml(html, {
    allowedTags: ["img"],
    allowedAttributes: { img: ["src"] },
    exclusiveFilter: (frame) => {
      const path = managedStoragePathFromValue(frame.attribs.src);
      if (path) paths.add(path);
      return false;
    },
  });
  return paths;
}
