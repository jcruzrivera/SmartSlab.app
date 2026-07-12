import { redirect } from "next/navigation";

import { getSlabByShortCode } from "@/lib/db/slabs";
import { getCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

/**
 * QR label target. A phone's native camera opens smartslab.store/s/{code}; this
 * handler routes the scan without rendering a page shell (fast):
 *   - owner  -> the mobile quick-action page for that slab
 *   - public -> the public listing (showroom use) when it's available
 *   - else   -> a generic browse fallback (private slab / unknown code)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  const slab = await getSlabByShortCode(code.toUpperCase());

  if (!slab) {
    redirect("/browse?not_found=1");
  }

  const user = await getCurrentDbUser();

  if (user && user.id === slab.vendorId) {
    redirect(`/dashboard/scan/${slab.id}`);
  }

  if (slab.status === "available") {
    redirect(`/slab/${slab.id}?utm_source=qr`);
  }

  redirect("/browse");
}
