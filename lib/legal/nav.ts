export type LegalNavItem = {
  href: string;
  label: string;
  description: string;
};

export const LEGAL_NAV: LegalNavItem[] = [
  {
    href: "/legal/terms",
    label: "Terms of Service",
    description: "Rules for using the SmartSlab marketplace.",
  },
  {
    href: "/legal/privacy",
    label: "Privacy Policy",
    description: "How we collect, use, and protect your data.",
  },
  {
    href: "/legal/shipping",
    label: "Shipping Policy",
    description: "Pickup, delivery, and logistics coordination.",
  },
  {
    href: "/legal/refunds",
    label: "Refund Policy",
    description: "Returns, cancellations, and payment disputes.",
  },
  {
    href: "/legal/safety",
    label: "Safety & Compliance",
    description: "Handling stone slabs and regulatory responsibilities.",
  },
  {
    href: "/faq",
    label: "FAQ",
    description: "Answers to common buyer and seller questions.",
  },
];

export const LEGAL_LAST_UPDATED = "June 17, 2026";
