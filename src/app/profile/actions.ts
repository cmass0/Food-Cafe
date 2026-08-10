"use server";

import { revalidatePath } from "next/cache";

import { UserUpdateSchema } from "@/domain/user/schema";
import * as userService from "@/domain/user/service";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const rawPhotoUrl = formData.get("photo_url");
  const photoUrl = typeof rawPhotoUrl === "string" ? rawPhotoUrl.trim() : undefined;

  const payload = UserUpdateSchema.parse({
    display_name: formData.get("display_name")?.toString(),
    photo_url: photoUrl === "" ? null : photoUrl,
  });

  await userService.updateSelf(payload);
  revalidatePath("/profile");
}
