import { ChefHat } from "lucide-react";

import { cn } from "@/lib/utils";

type FoodImagePlaceholderProps = {
  // sm은 작은 썸네일용으로 글자 없이 아이콘만 보여준다.
  size?: "md" | "sm";
  className?: string;
};

// 사진이 없는 레시피·조합 이미지 자리. 빈 색 상자 대신 요리 아이콘을 둔다.
export default function FoodImagePlaceholder({
  size = "md",
  className,
}: FoodImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f7f4ef] to-[#e7f0e4] text-[#7c9a80]",
        className
      )}
    >
      <ChefHat
        className={size === "sm" ? "h-4 w-4" : "h-8 w-8"}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {size === "md" ? <span className="text-xs font-medium">사진 준비 중</span> : null}
    </div>
  );
}
