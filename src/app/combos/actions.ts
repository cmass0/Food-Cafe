"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import * as comboService from "@/domain/combo/service";
import type { ComboInsertDb, ComboUpdateDb } from "@/domain/combo/types";
import { getServerSupabase } from "@/lib/supabase/server";

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

export async function createComboAction(input: ComboInsertDb) {
  let comboId: string;
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      throw new Error("알 수 없는 오류가 발생했습니다.");
    }
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const combo = await comboService.createCombo(supabase, input);
    comboId = combo.id;
  } catch (error) {
    handleError(error);
  }

  revalidatePath("/combos");
  revalidatePath("/search");
  redirect(`/combos/${comboId}`);
}

export async function updateComboAction(id: string, patch: ComboUpdateDb) {
  try {
    const supabase = await getServerSupabase();
    const combo = await comboService.updateCombo(supabase, id, patch);
    revalidatePath(`/combos/${id}`);
    revalidatePath("/combos");
    revalidatePath("/search");
    return combo;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteComboAction(id: string) {
  try {
    const supabase = await getServerSupabase();
    await comboService.removeCombo(supabase, id);
  } catch (error) {
    handleError(error);
  }

  revalidatePath("/combos");
  revalidatePath("/search");
  redirect("/combos");
}
