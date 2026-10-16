export const WRITING_ASSISTANT_COPY = {
  recipe: {
    label: "레시피",
    placeholder: "재료, 만들고 싶은 요리, 사용할 도구 등 편하게 적어주세요.",
    example: "두부로 담백한 저녁을 만들고 싶어요. 프라이팬이 있고 20분 정도 쓸 수 있어요.",
    formNote: null,
  },
  combo: {
    label: "조합",
    placeholder: "함께 먹고 싶은 레시피나 상품, 원하는 맛을 적어주세요.",
    example: "컵라면에 뭔가 곁들여서 든든한 한 끼로 먹고 싶어요. 너무 맵지 않게요.",
    // 반영 규칙(features/writing-assistant/combo-draft.ts)을 사용자에게 알리는 문구
    formNote:
      "폼에 넣은 레시피와 상품은 모두 조합에 그대로 들어가요. AI는 이걸 바탕으로 조리 단계를 쓰고, 필요하면 상품을 더 제안해요.",
  },
};
