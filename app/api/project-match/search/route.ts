import { NextResponse } from "next/server";

import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { isPlanLimitError } from "@/lib/plan/enforce";
import { runSmartfinderSearch } from "@/lib/smartfinder/search";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pieces =
    typeof body === "object" && body !== null
      ? (body as { pieces?: unknown }).pieces
      : undefined;

  try {
    const result = await runSmartfinderSearch(user, pieces);
    return NextResponse.json(result);
  } catch (error) {
    if (isPlanLimitError(error)) {
      return NextResponse.json(error.toJSON(), { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not run SmartFinder search." },
      { status: 500 },
    );
  }
}
