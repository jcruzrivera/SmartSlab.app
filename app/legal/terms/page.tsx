import type { Metadata } from "next";

import { PolicyPage } from "@/components/legal/policy-page";
import { buildLegalMetadata } from "@/lib/legal/metadata";
import { termsOfService } from "@/lib/legal/policies/terms";

export const metadata: Metadata = buildLegalMetadata({
  title: "Terms of Service",
  description: termsOfService.description,
  path: "/legal/terms",
});

export default function TermsPage() {
  return <PolicyPage content={termsOfService} currentPath="/legal/terms" />;
}
