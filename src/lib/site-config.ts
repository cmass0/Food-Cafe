export const SITE_NAME = "FoodCafe";
export const SITE_DESCRIPTION = "레시피와 음식 조합을 발견하고 요리 이야기를 공유하는 커뮤니티";

// 배포 주소를 우선 사용하고, 로컬 개발 환경에서는 localhost를 기본값으로 사용합니다.
const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const baseUrl =
  configuredBaseUrl ||
  (vercelProductionUrl ? `https://${vercelProductionUrl}` : "http://localhost:3000");

export const SITE_URL = new URL(baseUrl);
