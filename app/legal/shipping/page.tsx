import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { shippingPolicy } from "@/lib/legal/policies/shipping";

export const metadata: Metadata = buildLegalMetadata({
  title: "Shipping Policy",
  description: shippingPolicy.description,
  path: "/legal/shipping",
});

export default function ShippingPage() {
  return (
    <PolicyPage content={shippingPolicy} currentPath="/legal/shipping" />
  );
}
