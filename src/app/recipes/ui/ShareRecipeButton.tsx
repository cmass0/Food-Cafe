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
      className="h-11 self-start rounded-full bg-[#34783f] px-6 text-sm font-bold text-white shadow-sm shadow-[#34783f]/20 hover:bg-[#2f6f39] md:self-auto"
      onClick={handleShare}
    >
      <Plus className="mr-1.5 h-4 w-4" />
      레시피 공유하기
    </Button>
  );
}
