import type { Metadata } from "next";

import { getConfiguredAppUrl } from "@/lib/url";

const SITE_NAME = "SmartSlab";

export function buildLegalMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  const url = `${getConfiguredAppUrl()}${input.path}`;

  return {
    title: fullTitle,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: input.description,
    },
    robots: { index: true, follow: true },
  };
}
