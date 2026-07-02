import type { Metadata } from "next";

const SITE_NAME = "SmartSlab";
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://smart-slab-app.vercel.app";

export function buildLegalMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${input.path}`;

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
