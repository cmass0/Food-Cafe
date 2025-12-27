import z from "zod";
import { tagSchema } from "../recipe/schema";

export const comboListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  tag: z.array(tagSchema).optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});
