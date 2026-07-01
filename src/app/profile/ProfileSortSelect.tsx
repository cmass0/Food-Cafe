"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileSort } from "./profile-types";

const sortOptions: Array<{ value: ProfileSort; label: string }> = [
  { value: "recent", label: "최신순" },
  { value: "like", label: "좋아요순" },
  { value: "view", label: "조회순" },
];

type ProfileSortSelectProps = {
  value: ProfileSort;
};

export default function ProfileSortSelect({ value }: ProfileSortSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(nextValue: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sort", nextValue);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="정렬 방식"
        className="h-12 w-[132px] rounded-lg border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
