export type DifficultyLabel = "매우 쉬움" | "쉬움" | "보통" | "어려움" | "매우 어려움";

export type DifficultyMeta = {
  label: DifficultyLabel;
  description: string;
  warning: string;
  recommend: string;
};

export const ComboDifficultyMetaManual: Record<DifficultyLabel, DifficultyMeta> = {
  "매우 쉬움": {
    label: "매우 쉬움",
    description: "단순히 레시피를 합치거나, 재료를 조합하는 등 아주 쉬운 난이도 입니다.",
    warning: "특별한 주의사항은 없습니다.",
    recommend: "요리 초보자, 자취생",
  },
  쉬움: {
    label: "쉬움",
    description:
      "기본적인 조리 도구 사용이 요구되지만, 재료가 추가 된다면 조금 손이 갈 수 있습니다.",
    warning: "불 조절만 주의해주세요.",
    recommend: "초보자, 간단한 집밥",
  },
  보통: {
    label: "보통",
    description: "조리 순서와 타이밍을 어느 정도 신경 써야 하는 난이도 입니다.",
    warning: "재료 손질과 조리 순서를 미리 확인하세요.",
    recommend: "요리 경험이 있는 사용자",
  },
  어려움: {
    label: "어려움",
    description: "기존의 완성된 레시피 및 재료들의 이해가 필요하며, 손질과 조리 난이도가 있습니다.",
    warning: "불 조절, 타이밍 실수같은 요소가 맛에 큰 영향을 줘요.",
    recommend: "중급 이상 사용자",
  },
  "매우 어려움": {
    label: "매우 어려움",
    description: "숙련된 조리 기술과 경험이 필요한 최고 난이도 입니다.",
    warning: "실패 확률이 높으니 조합된 재료 및 레시피를 충분히 숙지하세요.",
    recommend: "요리에 익숙한 숙련자",
  },
};

export const difficultyLabels = Object.keys(ComboDifficultyMetaManual) as DifficultyLabel[];

export function getComboDifficultyMeta(label: string): DifficultyMeta {
  return ComboDifficultyMetaManual[label as DifficultyLabel];
}
