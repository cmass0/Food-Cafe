import { expect, type APIRequestContext, type Page } from "@playwright/test";

export type ResourceKind = "recipes" | "combos" | "posts";

type ResourceListResponse = {
  data?: {
    items?: Array<{ id?: unknown }>;
  };
};

export async function firstResourceId(
  request: APIRequestContext,
  resource: ResourceKind
): Promise<string | null> {
  const response = await request.get(`/api/${resource}?limit=1&page=1`);
  expect(response.ok(), `${resource} 목록 API가 성공해야 합니다.`).toBeTruthy();

  const body = (await response.json()) as ResourceListResponse;
  const id = body.data?.items?.[0]?.id;
  return typeof id === "string" ? id : null;
}

export function resourceIdFromPage(page: Page, resource: ResourceKind): string {
  const parts = new URL(page.url()).pathname.split("/").filter(Boolean);
  const resourceIndex = parts.indexOf(resource);
  const id = resourceIndex >= 0 ? parts[resourceIndex + 1] : undefined;

  if (!id) {
    throw new Error(`${resource} 상세 URL에서 ID를 찾지 못했습니다: ${page.url()}`);
  }
  return id;
}

export async function cleanupResource(
  page: Page,
  resource: ResourceKind,
  id: string | null
): Promise<void> {
  if (!id) return;

  const response = await page.request.delete(`/api/${resource}/${id}`);
  if (response.status() !== 200 && response.status() !== 404) {
    throw new Error(`${resource}/${id} 테스트 데이터 정리 실패: HTTP ${response.status()}`);
  }
}
