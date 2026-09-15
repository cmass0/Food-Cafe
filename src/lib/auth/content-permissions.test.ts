import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getContentPermissions, resolveContentPermissions } from "./content-permissions";

function createClient(data: boolean | null, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return {
    client: { rpc } as unknown as Parameters<typeof getContentPermissions>[0],
    rpc,
  };
}

describe("getContentPermissions", () => {
  test("비로그인 사용자는 수정과 삭제를 할 수 없다", async () => {
    const { client, rpc } = createClient(false);

    await expect(getContentPermissions(client, undefined, "writer-id")).resolves.toEqual({
      canEdit: false,
      canDelete: false,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  test("작성자는 자신의 콘텐츠를 수정하고 삭제할 수 있다", async () => {
    const { client, rpc } = createClient(false);

    await expect(getContentPermissions(client, "writer-id", "writer-id")).resolves.toEqual({
      canEdit: true,
      canDelete: true,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  test.each([
    [true, { canEdit: false, canDelete: true }],
    [false, { canEdit: false, canDelete: false }],
  ] as const)(
    "다른 사용자의 관리자 여부가 %s이면 해당 권한을 반환한다",
    async (isAdmin, expected) => {
      const { client, rpc } = createClient(isAdmin);

      await expect(getContentPermissions(client, "viewer-id", "writer-id")).resolves.toEqual(
        expected
      );
      expect(rpc).toHaveBeenCalledOnce();
    }
  );

  test("관리자 확인 RPC가 실패하면 오류를 숨기지 않는다", async () => {
    const failure = new Error("RPC failed");
    const { client } = createClient(null, failure);

    await expect(getContentPermissions(client, "viewer-id", "writer-id")).rejects.toBe(failure);
  });
});

describe("콘텐츠 권한 정책", () => {
  test.each([
    ["비로그인", undefined, "writer-id", false, { canEdit: false, canDelete: false }],
    ["작성자", "writer-id", "writer-id", false, { canEdit: true, canDelete: true }],
    ["다른 사용자", "viewer-id", "writer-id", false, { canEdit: false, canDelete: false }],
    ["관리자", "admin-id", "writer-id", true, { canEdit: false, canDelete: true }],
    ["작성자 없는 콘텐츠", "viewer-id", null, false, { canEdit: false, canDelete: false }],
  ] as const)("%s의 수정·삭제 권한을 계산한다", (_label, userId, writerUid, isAdmin, expected) => {
    expect(resolveContentPermissions(userId, writerUid, isAdmin)).toEqual(expected);
  });
});
