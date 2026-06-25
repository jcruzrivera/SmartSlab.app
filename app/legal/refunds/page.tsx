import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { refundPolicy } from "@/lib/legal/policies/refunds";

export const metadata: Metadata = buildLegalMetadata({
  title: "Refund Policy",
  description: refundPolicy.description,
  path: "/legal/refunds",
});

export default function RefundsPage() {
  return <PolicyPage content={refundPolicy} currentPath="/legal/refunds" />;
}
