import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { privacyPolicy } from "@/lib/legal/policies/privacy";

export const metadata: Metadata = buildLegalMetadata({
  title: "Privacy Policy",
  description: privacyPolicy.description,
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return <PolicyPage content={privacyPolicy} currentPath="/legal/privacy" />;
}
