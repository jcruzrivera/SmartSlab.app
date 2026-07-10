import { NextResponse } from "next/server";

import { isDbConfigured } from "@/lib/db/client";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { assertInventoryCapacity, isPlanLimitError } from "@/lib/plan/enforce";
import { createSlabFromParsedForm } from "@/lib/slabs/create-from-form";
import { parseSlabFormData } from "@/lib/validations/slab-form";

export const dynamic = "force-dynamic";

/**
 * Programmatic slab create (same validation as the dashboard form).
 * Enforces per-plan inventory caps before insert.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = parseSlabFormData(formData);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Please review the form fields.",
      },
      { status: 400 },
    );
  }

  try {
    await assertInventoryCapacity(user, 1);
    const id = await createSlabFromParsedForm(user.id, parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (isPlanLimitError(error)) {
      return NextResponse.json(error.toJSON(), { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not save the listing." },
      { status: 500 },
    );
  }
}
