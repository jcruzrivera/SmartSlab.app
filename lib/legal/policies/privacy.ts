import type { PolicyContent } from "@/lib/legal/types";

export const privacyPolicy: PolicyContent = {
  title: "Privacy Policy",
  description:
    "SmartSlab respects your privacy. This policy explains what information we collect when you browse, buy, or sell on our stone marketplace, and how we use third-party services such as Clerk and Stripe.",
  sections: [
    {
      id: "overview",
      title: "1. Overview",
      paragraphs: [
        "SmartSlab (\"we,\" \"us\") collects information to operate the marketplace, process payments, prevent fraud, and improve search and discovery. This policy applies to visitors, Buyers, and Sellers.",
      ],
    },
    {
      id: "information-collected",
      title: "2. Information we collect",
      paragraphs: [
        "We collect information you provide directly and data generated through your use of the platform.",
      ],
      bullets: [
        "Account data: name, email, company name, phone, and address (via Clerk and your profile).",
        "Listing data: photos, descriptions, dimensions, pricing, and general location (city/state/ZIP) you upload as a Seller.",
        "Transaction data: order amounts, payment status, and Stripe payment identifiers.",
        "Usage data: pages viewed, search filters, device/browser type, and approximate IP-based location for browse features.",
        "Communications: support messages and emails related to orders.",
      ],
    },
    {
      id: "how-we-use",
      title: "3. How we use information",
      paragraphs: [
        "We use collected data to authenticate users, display listings, calculate distances in search, process payments, send transactional emails (order confirmations, sale notifications), enforce our Terms, and comply with legal obligations.",
        "We do not sell your personal information to third-party marketers.",
      ],
    },
    {
      id: "contact-reveal",
      title: "4. Vendor contact and location privacy",
      paragraphs: [
        "Public listings show general area information (city, state, or ZIP) but not a Seller's full street address or phone number until a Buyer completes payment for that slab.",
        "After payment, the Buyer receives the Seller's contact details needed to coordinate pickup or delivery. Sellers should not publish private addresses in public listing fields.",
      ],
    },
    {
      id: "geolocation",
      title: "5. Location and geolocation",
      paragraphs: [
        "On the browse page, SmartSlab may use approximate location from your IP address or, if you allow it, precise browser geolocation to sort and filter slabs by distance. Precise coordinates are stored in your browser (localStorage) and are not written to listing URLs or server logs as buyer coordinates.",
        "Seller slab coordinates are derived from geocoding public city/state/ZIP for search purposes.",
      ],
    },
    {
      id: "third-parties",
      title: "6. Third-party services",
      paragraphs: [
        "We share data with service providers only as needed to operate the marketplace:",
      ],
      bullets: [
        "Clerk — authentication and account management.",
        "Stripe — payment processing and Seller payouts via Stripe Connect.",
        "Neon — database hosting for listings and orders.",
        "Vercel — application hosting, image storage (Vercel Blob), and edge geolocation headers.",
        "Resend — transactional email delivery when configured.",
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies and similar technologies",
      paragraphs: [
        "We use essential cookies and local storage for authentication sessions (Clerk) and optional buyer location caching. Analytics cookies may be added in the future with notice on this page.",
        "You can control cookies through your browser settings; disabling essential cookies may limit account features.",
      ],
    },
    {
      id: "retention",
      title: "8. Data retention",
      paragraphs: [
        "We retain account and transaction records as long as your account is active and as required for tax, fraud prevention, and legal compliance. You may request deletion of your account subject to outstanding orders and legal retention requirements.",
      ],
    },
    {
      id: "rights",
      title: "9. Your rights",
      paragraphs: [
        "Depending on your jurisdiction, you may have rights to access, correct, delete, or export personal data. Contact us through your account or platform support to submit a request. We will verify your identity before processing requests.",
      ],
    },
    {
      id: "security",
      title: "10. Security",
      paragraphs: [
        "We use industry-standard safeguards including encrypted connections (HTTPS), access controls, and payment processing through PCI-compliant Stripe infrastructure. No method of transmission over the Internet is 100% secure.",
      ],
    },
    {
      id: "children",
      title: "11. Children's privacy",
      paragraphs: [
        "SmartSlab is not directed to children under 13 (or 16 where applicable). We do not knowingly collect data from children.",
      ],
    },
    {
      id: "changes",
      title: "12. Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy periodically. The \"Last updated\" date at the top of this page reflects the latest revision.",
      ],
    },
  ],
};
