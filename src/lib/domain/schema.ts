import { z } from "zod";

export const imageFieldSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z
    .string()
    .trim()
    .min(1, "대표 이미지를 선택해 주세요")
    .max(2048, "이미지 경로는 2048자 이하만 가능합니다.")
    .nullable()
    .optional()
);

export const imageFileSchema = z
  .union([z.instanceof(File), z.null()], {
    required_error: "대표 이미지를 파일로 선택해 주세요.",
  })
  .superRefine((file, ctx) => {
    if (!file) {
      ctx.addIssue({ code: "custom", message: "대표 이미지를 파일로 선택해 주세요." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ctx.addIssue({ code: "custom", message: "파일 크기는 5MB 이하만 가능합니다." });
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      ctx.addIssue({ code: "custom", message: "지원하지 않는 파일 형식입니다." });
    }
  });

export const tagSchema = z
  .string()
  .trim()
  .min(1, "태그는 1자 이상이어야 합니다.")
  .max(50, "태그는 50자 이하만 가능합니다.");
