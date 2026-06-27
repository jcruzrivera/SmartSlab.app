import { HowItWorksContent } from "@/components/how-it-works/how-it-works-content";
import { buildLegalMetadata } from "@/lib/legal/metadata";

export const metadata = buildLegalMetadata({
  title: "How It Works",
  description:
    "Learn how SmartSlab connects stone buyers and sellers — browse slabs, secure checkout, vendor payouts, and pickup coordination.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0b1120]">
      <HowItWorksContent />
    </main>
  );
}
