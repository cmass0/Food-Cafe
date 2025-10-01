"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/session";
import { UserUpdateSchema } from "@/features/user/schema";
import * as userRepo from "@/features/user/repository";

export async function updateProfileAction(formData: FormData) {
  await requireAuth();

  const payload = UserUpdateSchema.parse({
    display_name: formData.get("display_name")?.toString(),
    photo_url: formData.get("photo_url")?.toString(),
  });

  const updated = await userRepo.updateSelf(payload);
  revalidatePath("/profile");
  return updated.id;
}
