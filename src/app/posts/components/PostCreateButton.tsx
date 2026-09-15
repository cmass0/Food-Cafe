"use client";

import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { cn } from "@/lib/utils";

type PostCreateButtonProps = {
  appearance?: "solid" | "outline";
  className?: string;
};

export default function PostCreateButton({
  appearance = "solid",
  className,
}: PostCreateButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  function handleClick() {
    if (!user) {
      openAuthModal({ next: "/posts/new" });
      return;
    }

    router.push("/posts/new");
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={appearance === "outline" ? "outline" : "default"}
      className={cn(
        "h-10 rounded-lg px-5 text-sm font-bold",
        appearance === "solid"
          ? "bg-[#34783f] text-white shadow-sm hover:bg-[#2f6f39]"
          : "border-[#15933d] bg-white text-[#16883d] hover:border-[#0d7d31] hover:bg-emerald-50 hover:text-[#0d7d31]",
        className
      )}
    >
      <PencilLine className="mr-2 h-4 w-4" />
      글쓰기
    </Button>
  );
}
