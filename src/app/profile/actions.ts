"use server";

import { revalidatePath } from "next/cache";

import { UserUpdateSchema } from "@/domain/user/schema";
import * as userService from "@/domain/user/service";
import { requireAuthContext } from "@/lib/auth/session";
import { storagePrefix } from "@/lib/storage/paths";
import { safeDiscardFailedUploads } from "@/lib/storage/server";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const rawPhotoUrl = formData.get("photo_url");
  const photoUrl = typeof rawPhotoUrl === "string" ? rawPhotoUrl.trim() : undefined;

  const payload = UserUpdateSchema.parse({
    display_name: formData.get("display_name")?.toString(),
    photo_url: photoUrl === "" ? null : photoUrl,
  });

  const rawUploadedPath = formData.get("uploaded_path");
  const uploadedPath = typeof rawUploadedPath === "string" ? rawUploadedPath : "";
  const { user } = await requireAuthContext();

  try {
    await userService.updateSelf(payload);
  } catch (error) {
    await safeDiscardFailedUploads(
      user.id,
      storagePrefix("avatars", user.id),
      uploadedPath ? [uploadedPath] : []
    );
    throw error;
  }

  revalidatePath("/profile");
}
