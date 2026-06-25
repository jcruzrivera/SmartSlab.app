import type { PolicyContent } from "@/lib/legal/types";

export const termsOfService: PolicyContent = {
  title: "Terms of Service",
  description:
    "These Terms govern your access to and use of SmartSlab, a marketplace that connects independent stone vendors with buyers. SmartSlab is a platform — we are not the seller of listed slabs.",
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of terms",
      paragraphs: [
        "By accessing SmartSlab, creating an account, listing inventory, or completing a purchase, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.",
        "SmartSlab may update these Terms from time to time. Material changes will be posted on this page with an updated effective date. Continued use after changes constitutes acceptance.",
      ],
    },
    {
      id: "platform-role",
      title: "2. Marketplace role",
      paragraphs: [
        "SmartSlab operates an online marketplace for natural stone slabs and remnants. Independent third-party vendors (\"Sellers\") create and manage their own listings. Buyers purchase directly from Sellers through checkout powered by Stripe Connect.",
        "SmartSlab is not a party to the sale of stone between Buyer and Seller, except as the payment facilitator and platform operator. We do not take title to inventory, store slabs, or guarantee the condition, dimensions, or suitability of any listing.",
      ],
    },
    {
      id: "accounts",
      title: "3. Accounts and eligibility",
      paragraphs: [
        "You must provide accurate registration information and keep your account credentials secure. You are responsible for all activity under your account.",
        "Sellers must complete Stripe Connect onboarding before receiving payouts. Buyers must be authorized to use their chosen payment method. You must be at least 18 years old and able to form a binding contract.",
      ],
    },
    {
      id: "listings",
      title: "4. User-generated listings",
      paragraphs: [
        "Sellers are solely responsible for the accuracy of listing content, including photos, dimensions, material type, finish, quantity, price, and location. Listings must represent physical inventory the Seller actually holds and is authorized to sell.",
        "SmartSlab may remove or hide listings that violate these Terms, appear fraudulent, or create legal or safety risk. We do not pre-approve every listing and are not liable for Seller misrepresentations.",
      ],
      bullets: [
        "No counterfeit, stolen, or mislabeled material.",
        "No duplicate or misleading photos.",
        "Dimensions and thickness must reflect actual slab measurements.",
        "Remnants must be listed as unique pieces (quantity 1).",
      ],
    },
    {
      id: "payments",
      title: "5. Payments and platform fees",
      paragraphs: [
        "Checkout is processed through Stripe. When you buy a slab, funds are collected by SmartSlab and allocated to the Seller's connected Stripe account, minus SmartSlab's platform commission (currently disclosed at checkout and in the Seller dashboard).",
        "Seller payout timing and tax reporting are governed by Stripe's terms and applicable law. SmartSlab does not hold slabs in escrow beyond the payment flow described at checkout.",
        "Vendor contact details and exact slab location are revealed to the Buyer only after payment is successfully processed, so coordination can occur off-platform while payment remains protected through SmartSlab.",
      ],
    },
    {
      id: "buyer-obligations",
      title: "6. Buyer obligations",
      paragraphs: [
        "Buyers must review listing details carefully before purchase. Stone is a natural product; color, veining, and appearance may vary from photos.",
        "After payment, Buyers coordinate pickup or delivery directly with the Seller using the contact information unlocked on the order. Buyers are responsible for transport, equipment, and inspection at the time of pickup unless otherwise agreed in writing with the Seller.",
      ],
    },
    {
      id: "seller-obligations",
      title: "7. Seller obligations",
      paragraphs: [
        "Sellers must honor sold listings, maintain accurate inventory counts, and respond promptly to Buyers after a sale. Sellers must comply with applicable licensing, tax, and safety laws in their jurisdiction.",
        "Sellers grant SmartSlab a non-exclusive license to display listing content (photos, descriptions, pricing) for marketplace promotion. Sellers retain ownership of their content.",
      ],
    },
    {
      id: "prohibited",
      title: "8. Prohibited conduct",
      paragraphs: [
        "You may not circumvent SmartSlab to avoid platform fees, harass other users, scrape the site, interfere with checkout reservations, or use the platform for unlawful purposes.",
        "Attempting to complete the same sale twice, manipulating reservations, or posting false availability is strictly prohibited.",
      ],
    },
    {
      id: "disputes",
      title: "9. Disputes between users",
      paragraphs: [
        "Disputes regarding slab condition, delivery, or misrepresentation are primarily between Buyer and Seller. SmartSlab may, at its discretion, assist with communication but is not obligated to mediate every dispute.",
        "Payment disputes may be raised through Stripe according to our Refund Policy. Chargebacks initiated without good faith may result in account suspension.",
      ],
    },
    {
      id: "disclaimers",
      title: "10. Disclaimers and limitation of liability",
      paragraphs: [
        "THE PLATFORM IS PROVIDED \"AS IS.\" SMARTSLAB DISCLAIMS WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT TO THE MAXIMUM EXTENT PERMITTED BY LAW.",
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMARTSLAB WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS ARISING FROM LISTINGS, SALES, OR USE OF THE PLATFORM.",
      ],
    },
    {
      id: "contact",
      title: "11. Contact",
      paragraphs: [
        "Questions about these Terms may be directed through the contact information on SmartSlab or your account dashboard. For payment issues, include your order reference and Stripe receipt.",
      ],
    },
  ],
};
