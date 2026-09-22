import type { Metadata } from "next";

import { RecommendChat } from "./ui/RecommendChat";

export const metadata: Metadata = {
  title: "AI 추천",
  description: "FoodCafe에 등록된 레시피와 조합을 대화로 추천받아보세요.",
};

export default function RecommendPage() {
  return <RecommendChat />;
}
