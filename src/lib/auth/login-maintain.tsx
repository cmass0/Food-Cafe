// lib/auth/remember.ts
export const REMEMBER_KEY = "FC_REMEMBER";

export function getRemember(): boolean {
  if (typeof window === "undefined") return true; 
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRemember(on: boolean) {
  localStorage.setItem(REMEMBER_KEY, on ? "1" : "0");
}
