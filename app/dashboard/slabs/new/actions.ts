"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDbConfigured } from "@/lib/db/client";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { assertInventoryCapacity, isPlanLimitError } from "@/lib/plan/enforce";
import { createSlabFromParsedForm } from "@/lib/slabs/create-from-form";
import { parseSlabFormData } from "@/lib/validations/slab-form";

export type SlabFormState = {
  error?: string;
  upgradeTo?: "pro" | "premium";
};

export async function createSlabAction(
  _prevState: SlabFormState,
  formData: FormData,
): Promise<SlabFormState> {
  if (!isDbConfigured()) {
    return { error: "The marketplace database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return { error: "You must be signed in to publish a listing." };
  }

  const parsed = parseSlabFormData(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please review the form fields.",
    };
  }

  try {
    await assertInventoryCapacity(user, 1);
    await createSlabFromParsedForm(user.id, parsed.data);
  } catch (error) {
    if (isPlanLimitError(error)) {
      return { error: error.message, upgradeTo: error.upgradeTo };
    }
    return {
      error: "Could not save the listing. Please try again.",
    };
  }

  revalidatePath("/dashboard/slabs");
  revalidatePath("/browse");
  redirect("/dashboard/slabs");
}
