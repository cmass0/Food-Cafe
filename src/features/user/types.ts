import { z } from "zod";

export const UserCreateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).max(50),
});

export const UserUpdateSchema = z.object({
  username: z.string().min(1).max(50).optional(),
});

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserUpdateDTO = z.infer<typeof UserUpdateSchema>;

export interface User {
  id: string;
  email: string;
  username: string;
  likerecipe: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

