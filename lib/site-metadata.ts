import type { Metadata } from "next";

import { CANONICAL_APP_ORIGIN } from "@/lib/app-origin";

const SITE_NAME = "SmartSlab";

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    CANONICAL_APP_ORIGIN
  ).replace(/\/$/, "");
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  openGraphType?: "website" | "article";
}): Metadata {
  const url = `${siteOrigin()}${input.path}`;
  const title = input.title.includes(SITE_NAME)
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: input.openGraphType ?? "website",
    },
  };
}
