export type ProfileSection = "recipe" | "combo";
export type ProfileTab = "written" | "bookmark" | "like";
export type ProfileSort = "recent" | "like" | "view";
export type ProfileView = "grid" | "list";

export function normalizeProfileSection(value: string | undefined): ProfileSection {
  return value === "combo" ? "combo" : "recipe";
}

export function normalizeProfileTab(value: string | undefined): ProfileTab {
  return value === "bookmark" || value === "like" ? value : "written";
}

export function normalizeProfileSort(value: string | undefined): ProfileSort {
  return value === "like" || value === "view" ? value : "recent";
}

export function normalizeProfileView(value: string | undefined): ProfileView {
  return value === "list" ? "list" : "grid";
}
