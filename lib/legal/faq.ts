import type { FaqItem } from "@/lib/legal/types";

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-smartslab",
    question: "What is SmartSlab?",
    answer:
      "SmartSlab is an online marketplace where independent vendors list natural stone slabs and remnants, and buyers discover, compare, and purchase inventory. We facilitate listings, search, checkout, and payments — we are not the seller of the stone.",
  },
  {
    id: "who-sells",
    question: "Who sells on SmartSlab?",
    answer:
      "Independent fabricators, workshops, showrooms, and stone suppliers create their own listings. Each Seller is responsible for accuracy, availability, and fulfillment. SmartSlab does not own the inventory.",
  },
  {
    id: "how-payments-work",
    question: "How do payments work?",
    answer:
      "Checkout is powered by Stripe. When you buy a slab, your payment is processed securely. SmartSlab deducts a platform commission and transfers the remainder to the Seller's Stripe Connect account. Sellers must complete Stripe onboarding to receive payouts.",
  },
  {
    id: "when-contact-unlocked",
    question: "When do I get the seller's contact details?",
    answer:
      "For privacy and payment protection, the Seller's name, phone, and exact pickup address are hidden until your payment succeeds. After checkout, details appear on the slab page, in your purchase history, and in your confirmation email.",
  },
  {
    id: "shipping",
    question: "Does SmartSlab ship slabs?",
    answer:
      "No. SmartSlab does not transport stone. After payment, you coordinate pickup or hire a freight company with the Seller. See our Shipping Policy for loading and inspection guidance.",
  },
  {
    id: "double-purchase",
    question: "Can two people buy the same slab at once?",
    answer:
      "No. When checkout starts, the slab is reserved in our database for a short window. Only one buyer can complete payment for a single remnant or available unit. If someone else reserves it first, you'll see a message to browse other listings.",
  },
  {
    id: "full-slab-quantity",
    question: "What does quantity mean on full slabs?",
    answer:
      "If a Seller has multiple identical full slabs, they can list a quantity greater than one. Each sale reduces stock by one. Remnants are always unique pieces with quantity 1.",
  },
  {
    id: "refunds",
    question: "Can I get a refund?",
    answer:
      "Because each slab is unique, refunds depend on the situation — Seller non-fulfillment, material misrepresentation, or payment disputes may qualify. Start with the Seller, then see our Refund Policy and your purchase history for next steps.",
  },
  {
    id: "sell-requirements",
    question: "What do I need to sell on SmartSlab?",
    answer:
      "Create an account, list your slab with accurate photos and dimensions, and connect Stripe for payouts under Dashboard → Payments. You can also bulk-import listings via CSV or duplicate an existing listing to save time.",
  },
  {
    id: "platform-fee",
    question: "What commission does SmartSlab charge?",
    answer:
      "SmartSlab charges a platform fee on each completed sale (shown in the Seller dashboard and at checkout setup). The fee covers payment processing coordination, marketplace infrastructure, and support.",
  },
  {
    id: "negotiable",
    question: "Are prices negotiable?",
    answer:
      "Some listings are marked negotiable. Negotiation happens between Buyer and Seller outside checkout unless we add formal offer tools in the future. The listed price is the starting point for Buy now checkout.",
  },
  {
    id: "location-search",
    question: "How does location search work?",
    answer:
      "Browse can use your approximate or precise location to sort slabs by distance. Seller locations are geocoded from city/state/ZIP. Your precise coordinates stay in your browser unless you choose to share them.",
  },
  {
    id: "account-help",
    question: "Where do I find my purchases or sales?",
    answer:
      "Buyers: Account → Purchase history (or \"My purchases\" in the menu). Sellers: Dashboard → Sales & orders for earnings and buyer information after a sale.",
  },
];

export const FAQ_CATEGORIES = [
  {
    label: "General",
    ids: ["what-is-smartslab", "who-sells", "account-help"],
  },
  {
    label: "Buying",
    ids: ["how-payments-work", "when-contact-unlocked", "shipping", "double-purchase", "refunds", "negotiable", "location-search"],
  },
  {
    label: "Selling",
    ids: ["sell-requirements", "platform-fee", "full-slab-quantity"],
  },
] as const;
