"use server";

import * as comboService from "@/domain/combo/service";
import type { ComboInsertDb, ComboUpdateDb } from "@/domain/combo/types";
import { clearTrendingCache } from "@/features/trending/cache";
import { requireAuthContext } from "@/lib/auth/session";
import { storagePrefix } from "@/lib/storage/paths";
import { safeDiscardFailedUploads } from "@/lib/storage/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

function handleError(error: unknown): never {
  if (error instanceof ZodError) {
    const first = error.issues.at(0);
    throw new Error(first?.message ?? "입력값을 확인해 주세요.");
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("알 수 없는 오류가 발생했습니다.");
}

export async function createComboAction(input: ComboInsertDb, uploadedPaths: string[] = []) {
  let comboId: string;
  let userId: string | null = null;
  try {
    const { supabase, user } = await requireAuthContext();
    userId = user.id;
    const combo = await comboService.createCombo(supabase, {
      ...input,
      writer_uid: user.id,
    });
    comboId = combo.id;
  } catch (error) {
    if (userId && input.id) {
      await safeDiscardFailedUploads(
        userId,
        storagePrefix("combos", userId, input.id),
        uploadedPaths
      );
    }
    handleError(error);
  }

  revalidatePath("/combos");
  revalidatePath("/search");
  return { id: comboId };
}

export async function updateComboAction(
  id: string,
  patch: ComboUpdateDb,
  uploadedPaths: string[] = []
) {
  let userId: string | null = null;
  let persisted = false;
  try {
    const { supabase, user } = await requireAuthContext();
    userId = user.id;
    const combo = await comboService.updateCombo(supabase, id, user.id, patch);
    if (!combo) throw new Error("수정할 수 있는 조합을 찾지 못했습니다.");
    persisted = true;
    revalidatePath(`/combos/${id}`);
    revalidatePath("/combos");
    revalidatePath("/search");
    return combo;
  } catch (error) {
    if (userId && !persisted) {
      await safeDiscardFailedUploads(userId, storagePrefix("combos", userId, id), uploadedPaths);
    }
    handleError(error);
  }
}

export async function deleteComboAction(id: string) {
  try {
    const { supabase } = await requireAuthContext();
    const deleted = await comboService.removeCombo(supabase, id);
    if (!deleted) throw new Error("삭제할 수 있는 조합을 찾지 못했습니다.");
  } catch (error) {
    handleError(error);
  }

  clearTrendingCache();
  revalidatePath("/combos");
  revalidatePath("/search");
  redirect("/combos");
}
