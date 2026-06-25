import type { PolicyContent } from "@/lib/legal/types";

export const refundPolicy: PolicyContent = {
  title: "Refund Policy",
  description:
    "Because each stone slab and remnant is unique, refunds and cancellations follow marketplace rules designed to protect both Buyers and independent Sellers. Payments are processed through Stripe.",
  sections: [
    {
      id: "overview",
      title: "1. Overview",
      paragraphs: [
        "All purchases on SmartSlab are processed through Stripe Checkout. SmartSlab collects payment on behalf of the Seller and applies a platform commission before transferring the Seller's share via Stripe Connect.",
        "Refund eligibility depends on the circumstances of the order, Seller cooperation, and Stripe's payment dispute rules.",
      ],
    },
    {
      id: "before-pickup",
      title: "2. Cancellations before pickup",
      paragraphs: [
        "If a Buyer needs to cancel before pickup, contact the Seller immediately through the contact details unlocked after payment. Sellers may agree to cancel and cooperate with a refund at their discretion.",
        "SmartSlab may assist with communication but cannot force a Seller to accept a cancellation once a slab has been reserved or sold, except where required by law or clear listing error.",
      ],
    },
    {
      id: "seller-nonfulfillment",
      title: "3. Seller non-fulfillment",
      paragraphs: [
        "If a Seller cannot provide the paid slab (wrong slab sold, listing error, slab no longer available), the Buyer may be entitled to a full refund. Contact SmartSlab support with your order reference and evidence of non-fulfillment.",
        "Repeated Seller non-fulfillment may result in account suspension and Stripe payout review.",
      ],
    },
    {
      id: "condition-disputes",
      title: "4. Condition and description disputes",
      paragraphs: [
        "Disputes about material type, dimensions, finish, or visible defects should first be raised with the Seller at pickup or immediately upon discovery with photographic evidence.",
        "Because stone is natural and photos may not capture every variation, minor aesthetic differences alone may not qualify for a refund unless the listing materially misrepresented the product.",
      ],
    },
    {
      id: "stripe-disputes",
      title: "5. Stripe chargebacks and disputes",
      paragraphs: [
        "Buyers may initiate a payment dispute through their card issuer or Stripe according to applicable network rules. Fraudulent or bad-faith chargebacks may lead to account termination.",
        "Sellers receive dispute notifications through Stripe Connect and must respond with documentation (photos, messages, pickup confirmation) within Stripe's deadlines.",
      ],
    },
    {
      id: "platform-fees",
      title: "6. Platform fees on refunds",
      paragraphs: [
        "When a full refund is issued through Stripe, platform and processing fees may be reversed according to Stripe's policies. Partial refunds are handled proportionally where applicable.",
      ],
    },
    {
      id: "reservations",
      title: "7. Checkout reservations",
      paragraphs: [
        "When you click \"Buy now,\" the slab may be reserved for a limited time while you complete checkout. Abandoned checkouts release the reservation automatically. Completed payments mark the slab sold (or decrement quantity for multi-unit full slabs).",
      ],
    },
    {
      id: "non-refundable",
      title: "8. Generally non-refundable situations",
      paragraphs: [
        "Refunds are typically not available when:",
      ],
      bullets: [
        "The Buyer accepted the slab at pickup without documenting concerns.",
        "The Buyer ordered incorrect dimensions without verifying the listing.",
        "Natural variation in color or veining was accurately described.",
        "The Buyer failed to arrange pickup within an agreed reasonable period.",
      ],
    },
    {
      id: "how-to-request",
      title: "9. How to request help",
      paragraphs: [
        "Start with the Seller using unlocked contact details. If unresolved, reference your purchase in Account → Purchase history and contact platform support with order ID, photos, and a summary of the issue.",
      ],
    },
  ],
};
