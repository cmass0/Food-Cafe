"use client";

import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";

export default function PostCreateButton() {
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
      className="h-12 rounded-lg bg-[#15933d] px-7 text-base font-bold text-white shadow-sm hover:bg-[#0d7d31]"
    >
      <PencilLine className="mr-2 h-5 w-5" />
      글쓰기
    </Button>
  );
}
