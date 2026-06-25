import type { PolicyContent } from "@/lib/legal/types";

export const shippingPolicy: PolicyContent = {
  title: "Shipping Policy",
  description:
    "SmartSlab does not ship stone slabs. Sellers and Buyers coordinate pickup or third-party freight after payment. This policy explains how logistics work on our marketplace.",
  sections: [
    {
      id: "platform-role",
      title: "1. SmartSlab is not a carrier",
      paragraphs: [
        "SmartSlab is a marketplace platform. We do not warehouse, crate, or transport slabs. Each sale is fulfilled by the independent Seller and the Buyer (or the Buyer's chosen freight provider).",
      ],
    },
    {
      id: "after-payment",
      title: "2. Coordination after payment",
      paragraphs: [
        "When checkout completes successfully, the Buyer unlocks the Seller's contact information and the slab's exact pickup location on the listing page and in order confirmation email.",
        "Buyers and Sellers should agree on a pickup window, loading requirements, and any third-party freight arrangements promptly after payment.",
      ],
    },
    {
      id: "pickup",
      title: "3. Pickup and on-site loading",
      paragraphs: [
        "Most transactions involve Buyer pickup at the Seller's warehouse, workshop, or showroom. Buyers are responsible for:",
      ],
      bullets: [
        "Providing adequate vehicles, straps, and lifting equipment.",
        "Ensuring crew capacity for the weight and size of the slab.",
        "Inspecting the slab at pickup for visible damage or measurement discrepancies.",
        "Signing or confirming receipt when taking possession.",
      ],
    },
    {
      id: "freight",
      title: "4. Third-party freight",
      paragraphs: [
        "If the Buyer arranges a freight company, the Buyer is responsible for sharing accurate dimensions, weight estimates, and access instructions with the carrier. Sellers may require advance notice before freight arrival.",
        "SmartSlab is not liable for freight delays, damage in transit after the slab leaves the Seller's control, or carrier pricing disputes.",
      ],
    },
    {
      id: "timing",
      title: "5. Timing and availability",
      paragraphs: [
        "Listings reflect inventory available at the time of purchase. Reservation and checkout rules prevent double-selling the same physical slab. Sellers should make slabs accessible within a reasonable timeframe agreed with the Buyer.",
        "Failure to make a paid slab available for pickup may violate our Terms and Refund Policy.",
      ],
    },
    {
      id: "inspection",
      title: "6. Inspection at delivery or pickup",
      paragraphs: [
        "Stone is a natural product. Buyers should inspect slabs before accepting them. Document any concerns with photos at the time of pickup. Disputes about condition discovered after transport should be addressed directly with the Seller and, if applicable, through Stripe dispute channels.",
      ],
    },
    {
      id: "international",
      title: "7. Cross-border transactions",
      paragraphs: [
        "SmartSlab currently focuses on domestic marketplace operations. Cross-border sales may involve additional customs, import duties, and compliance obligations borne entirely by Buyer and Seller.",
      ],
    },
    {
      id: "support",
      title: "8. Platform support",
      paragraphs: [
        "SmartSlab can help facilitate contact between parties but does not dispatch carriers or guarantee delivery dates. For urgent coordination issues after payment, reference your order in account purchase history.",
      ],
    },
  ],
};
