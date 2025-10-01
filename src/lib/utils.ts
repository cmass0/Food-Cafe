import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | boolean | number | Record<string, boolean>)[]) {
  return twMerge(clsx(inputs));
}

