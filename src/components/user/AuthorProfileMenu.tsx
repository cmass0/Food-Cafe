"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AuthorProfileMenuProps = {
  name?: string | null;
  userId?: string | null;
  className?: string;
};

export default function AuthorProfileMenu({
  name,
  userId,
  className,
}: AuthorProfileMenuProps) {
  const displayName = name && name.trim().length > 0 ? name : "익명";

  if (!userId) {
    return <span className={className}>{displayName}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex items-center gap-1 text-current", className)}
        >
          <span className="underline underline-offset-2">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${userId}`}>프로필 확인</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
