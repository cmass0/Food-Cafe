import { describe, expect, test } from "vitest";

import { MAX_UPLOADED_PATHS, uploadedPathsFromFormData } from "./form-data";

function formDataWith(value?: string) {
  const formData = new FormData();
  if (value !== undefined) formData.set("uploaded_paths", value);
  return formData;
}

describe("uploadedPathsFromFormData", () => {
  test("JSON 문자열 배열을 경로 목록으로 읽는다", () => {
    const formData = formDataWith(JSON.stringify(["posts/u1/p1/a.jpg", "posts/u1/p1/b.jpg"]));

    expect(uploadedPathsFromFormData(formData)).toEqual([
      "posts/u1/p1/a.jpg",
      "posts/u1/p1/b.jpg",
    ]);
  });

  test("문자열이 아닌 원소는 걸러낸다", () => {
    const formData = formDataWith(JSON.stringify(["posts/u1/p1/a.jpg", 42, null, { x: 1 }]));

    expect(uploadedPathsFromFormData(formData)).toEqual(["posts/u1/p1/a.jpg"]);
  });

  test("상한을 넘는 경로는 앞에서부터 잘라낸다", () => {
    const paths = Array.from({ length: MAX_UPLOADED_PATHS + 10 }, (_, i) => `posts/u1/p1/${i}.jpg`);
    const result = uploadedPathsFromFormData(formDataWith(JSON.stringify(paths)));

    expect(result).toHaveLength(MAX_UPLOADED_PATHS);
    expect(result.at(-1)).toBe(`posts/u1/p1/${MAX_UPLOADED_PATHS - 1}.jpg`);
  });

  test("상한과 같은 개수는 그대로 유지한다", () => {
    const paths = Array.from({ length: MAX_UPLOADED_PATHS }, (_, i) => `posts/u1/p1/${i}.jpg`);

    expect(uploadedPathsFromFormData(formDataWith(JSON.stringify(paths)))).toHaveLength(
      MAX_UPLOADED_PATHS
    );
  });

  test.each([
    ["값이 없는 경우", undefined],
    ["빈 문자열", ""],
    ["깨진 JSON", "{이건 JSON이 아니다"],
    ["배열이 아닌 JSON", JSON.stringify({ path: "a.jpg" })],
    ["JSON 문자열 하나", JSON.stringify("posts/u1/p1/a.jpg")],
  ])("%s이면 빈 목록으로 처리하고 실패시키지 않는다", (_label, value) => {
    expect(uploadedPathsFromFormData(formDataWith(value))).toEqual([]);
  });

  test("다른 필드 이름도 읽을 수 있다", () => {
    const formData = new FormData();
    formData.set("images", JSON.stringify(["a.jpg"]));

    expect(uploadedPathsFromFormData(formData, "images")).toEqual(["a.jpg"]);
  });
});
