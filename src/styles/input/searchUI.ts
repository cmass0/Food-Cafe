import type { SlotsToClasses } from "@heroui/react";

export const searchInputClassNames: SlotsToClasses<
  "label" | "input" | "innerWrapper" | "inputWrapper"
> = {
  label: "text-foreground/80",
  input: "text-foreground placeholder:text-foreground/60",
  innerWrapper: "items-center",
  inputWrapper: [
    "bg-default-200/50",
    "dark:bg-default/60",
    "backdrop-blur-xl",
    "backdrop-saturate-200",
    "shadow-sm",
    "hover:bg-default-200/70",
    "dark:hover:bg-default/70",
    "group-data-[focus=true]:bg-default-200/50",
    "dark:group-data-[focus=true]:bg-default/60",
  ].join(" "),
};
