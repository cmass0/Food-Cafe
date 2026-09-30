"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";

export default function ShareRecipeButton() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  function handleShare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }
    router.push("/recipes/new");
  }

  return (
    <Button
      className="h-12 rounded-full bg-[#34783f] px-7 text-base font-bold text-white shadow-sm hover:bg-[#2f6f39]"
      onClick={handleShare}
    >
      <Plus className="mr-2 h-5 w-5" />
      레시피 공유하기
    </Button>
  );
}
