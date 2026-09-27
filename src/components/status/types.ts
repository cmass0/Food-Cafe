import type { ReactNode } from "react";

export type SectionErrorStateProps = {
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
  onRetry?: () => void | Promise<void>;
  retrying?: boolean;
};

export type SectionProps = Omit<SectionErrorStateProps, "retrying" | "className"> & {
  name: string;
  failed?: boolean;
  /** 요청한 페이지가 목록 범위를 벗어났다. children 대신 첫 페이지 안내를 보여 준다. */
  outOfRange?: boolean;
  /** 첫 페이지 링크를 만들 때 현재 주소에서 지울 페이지 쿼리 이름. 기본값 "page". */
  pageParam?: string;
  children: ReactNode;
  /** ID·검색어·페이지처럼 대상이 달라질 때 렌더링 오류를 초기화할 값. */
  resetKeys?: readonly (string | number | boolean | null | undefined)[];
  /** 정상 콘텐츠 레이아웃에는 영향을 주지 않고 오류 UI에만 적용한다. */
  errorClassName?: string;
  /** 오류가 나도 유지할 최소 탐색 링크 등. 오류 UI 아래에 표시한다. */
  recoveryContent?: ReactNode;
};
