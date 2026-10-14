import { type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 입력칸 오른쪽에 단위("분", "인분")를 붙여 보여준다.
export function SuffixInput({
  suffix,
  className,
  ...props
}: ComponentProps<typeof Input> & { suffix: string }) {
  return (
    <div className="relative">
      <Input className={cn("pr-12", className)} {...props} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        {suffix}
      </span>
    </div>
  );
}
