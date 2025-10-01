import { z } from "zod";

export type UserRow = {
  id: string;
  email: string | null;
  display_name: string;
  photo_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean | null;
};

export type UserUpdate = {
  display_name?: string | null;
  photo_url?: string | null;
};

// Legacy Firebase types & schemas (호환용)
export const UserCreateSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  username: z.string().min(1),
  likerecipe: z.array(z.string()).optional(),
});

export const UserUpdateLegacySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  likerecipe: z.array(z.string()).optional(),
});

export type User = z.infer<typeof UserCreateSchema> & {
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserUpdateDTO = z.infer<typeof UserUpdateLegacySchema>;

export const UserUpdateSchema = UserUpdateLegacySchema;
