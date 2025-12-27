"use server";

import { revalidatePath } from "next/cache";

import { UserUpdateSchema } from "@/domain/user/schema";
import * as userService from "@/domain/user/service";
import { requireAuth } from "@/lib/auth/session";

export async function updateProfileAction(formData: FormData): Promise<void> {
  await requireAuth();

  const payload = UserUpdateSchema.parse({
    display_name: formData.get("display_name")?.toString(),
    photo_url: formData.get("photo_url")?.toString(),
    email: formData.get("email")?.toString(),
  });

  await userService.updateSelf(payload);
  revalidatePath("/profile");
}
