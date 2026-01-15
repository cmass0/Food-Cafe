"use client";

import { useRouter } from "next/navigation";

import SlideShow from "@/component/navbar/mainslider/main-slide";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { useAuth } from "./auth/auth-context";

import RecipeTopFooterSlide from "@/component/footer/topRecipe/footer-slide";
import CombosTopFooterSlide from "@/component/footer/topRecipeCombo/footer-slide";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleCta = (targetPath: string) => {
    if (!user) {
      openAuthModal({ next: targetPath });
      return;
    }
    router.push(targetPath);
  };

  return (
    <div className="mx-auto mb-[100px] w-full max-w-[1500px] px-4 lg:px-0">
      <section>
        <header className="flex flex-col items-center justify-evenly gap-8 border-b border-[#bebebe] py-16 lg:flex-row lg:gap-[30px] lg:px-[10rem] lg:py-[10rem]">
          <span className="block h-[260px] w-full max-w-[450px] sm:h-[320px] lg:h-[350px]">
            <SlideShow />
          </span>
          <span>
            <h1 className="m-0 text-[32px] font-bold text-[#444] sm:text-[36px] lg:pl-[9.5rem] lg:text-[40px]">
              <span className="bg-gradient-to-r from-[#39b385] to-[#7cbe42] bg-clip-text text-transparent [-webkit-background-clip:text]">
                맛있는
              </span>{" "}
              레시피
            </h1>

            <h1 className="m-0 text-[32px] font-bold text-[#444] sm:text-[36px] lg:text-[40px]">
              건강한
              <span className="bg-gradient-to-r from-[#39b385] to-[#7cbe42] bg-clip-text text-transparent [-webkit-background-clip:text]">
                한 끼
              </span>
            </h1>
            <h1 className="m-0 bg-gradient-to-r from-[#39b385] to-[#7cbe42] bg-clip-text text-[32px] font-bold text-transparent [-webkit-background-clip:text] sm:text-[36px] lg:pl-[5rem] lg:text-[40px]">
              Only for you
            </h1>
            <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-20">
              <Button
                className="rounded-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] px-[1.6rem] py-[0.6rem] font-semibold text-white shadow-[0_8px_18px_rgba(22,163,74,0.35)] transition hover:from-[#15803d] hover:to-[#16a34a] hover:shadow-[0_10px_24px_rgba(22,163,74,0.45)]"
                onClick={() => handleCta("/posts")}
              >
                커뮤니티 참여하기
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.02)] px-[1.6rem] py-[0.6rem] font-medium text-[#0f172a] transition hover:border-[rgba(148,163,184,0.9)] hover:bg-[rgba(248,250,252,0.9)]"
                  >
                    레시피 공유하기
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>공유 형태를 선택해주세요</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCta("/recipes/new")}>
                    레시피
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCta("/combos/new")}>
                    레시피 조합
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </span>
        </header>
      </section>

      <section className="border-b border-[#bebebe] pb-[11rem]">
        <main className="mx-auto mt-[10rem] flex w-full max-w-[800px] flex-col items-center gap-20 px-4 text-center  text-[#444]">
          <section>
            <h2 className="text-[32px] sm:text-[36px] lg:text-[40px]">Welcome!</h2>
            <p className="text-[20px]">
              Food Cafe는 요리를 즐기고 좋아하는 여러분을 위한 최고의 레시피 공유 커뮤니티입니다.
              다양한 레시피를 서로 공유하고 받아가며 함께 즐거운 식탁을 만들어 보세요.
            </p>
            <p className="text-[20px] pt-10">
              Food Cafe에서 각자의 경험을 공유하고 서로 배우면서 더 풍성한 요리를 만들어갑니다.
              초보부터 베테랑까지 모두 에게 열려 있고 자신의 레시피를 평가받을 수도 있습니다.
            </p>
          </section>
        </main>
      </section>

      <section className="relative flex pb-16 w-full justify-center pt-16 border-b border-[#bebebe]">
        <CombosTopFooterSlide />
      </section>

      <section className="relative flex  w-full justify-center pt-16">
        <RecipeTopFooterSlide />
      </section>
    </div>
  );
}
