import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { safetyPolicy } from "@/lib/legal/policies/safety";

export const metadata: Metadata = buildLegalMetadata({
  title: "Safety & Compliance",
  description: safetyPolicy.description,
  path: "/legal/safety",
});

export default function SafetyPage() {
  return <PolicyPage content={safetyPolicy} currentPath="/legal/safety" />;
}
