import { DevelopersContent } from "@/components/developers/developers-content";
import { isDbConfigured } from "@/lib/db/client";
import { listPublicStores } from "@/lib/db/stores";
import { buildLegalMetadata } from "@/lib/legal/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildLegalMetadata({
  title: "Developers",
  description:
    "Embed your SmartSlab storefront on any website and query the public SmartSlab APIs — the embeddable widget, /embed.js, and the public stores API.",
  path: "/developers",
});

export default async function DevelopersPage() {
  const stores = isDbConfigured() ? await listPublicStores() : [];
  const demoSlug = stores[0]?.slug ?? null;

  return (
    <main className="min-h-screen">
      <DevelopersContent demoSlug={demoSlug} />
    </main>
  );
}
