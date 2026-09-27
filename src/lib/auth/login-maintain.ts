// 로그인 유지 설정을 로컬 스토리지에 저장하 및 불러오는 유틸 함수
export const REMEMBER_KEY = "FC_REMEMBER";

export function getRemember(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRemember(on: boolean) {
  localStorage.setItem(REMEMBER_KEY, on ? "1" : "0");
}
