import { z } from "zod";

export const UserCreateSchema = z.object({
  id: z.string().min(1).optional(),
  email: z.string().email(),
  username: z.string().min(1).max(50),
  likerecipe: z.array(z.string()).optional(),
});

export const UserUpdateSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  likerecipe: z.array(z.string()).optional(),
});

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserUpdateDTO = z.infer<typeof UserUpdateSchema>;

export interface User {
  id: string;
  email: string;
  username: string;
  likerecipe: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}
