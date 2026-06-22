import type { PolicyContent } from "@/lib/legal/types";

export const safetyPolicy: PolicyContent = {
  title: "Safety & Compliance",
  description:
    "Natural stone slabs are heavy, rigid, and potentially hazardous. SmartSlab provides a marketplace only; Sellers and Buyers are responsible for safe handling and regulatory compliance.",
  sections: [
    {
      id: "hazards",
      title: "1. Understanding the hazards",
      paragraphs: [
        "Slabs and remnants can weigh hundreds or thousands of pounds. Improper lifting, inadequate A-frames, or unsecured transport can cause serious injury, property damage, or fatalities.",
        "Always use trained personnel, appropriate rigging, and equipment rated for the load. Never attempt to move large slabs without proper tools and experience.",
      ],
    },
    {
      id: "buyer-responsibilities",
      title: "2. Buyer responsibilities",
      paragraphs: [
        "Buyers must assess whether they have the capability to receive and transport purchased stone. If not, hire a qualified stone fabricator or freight specialist before pickup.",
      ],
      bullets: [
        "Verify slab dimensions and weight estimates before scheduling transport.",
        "Use A-frames, clamps, and straps designed for stone.",
        "Wear appropriate PPE (gloves, steel-toe footwear, eye protection).",
        "Keep paths clear and ensure forklift or crane access if needed.",
      ],
    },
    {
      id: "seller-responsibilities",
      title: "3. Seller responsibilities",
      paragraphs: [
        "Sellers must store slabs safely, disclose known defects or cracks that affect handling, and provide reasonable loading assistance only if agreed in advance. Sellers must comply with local business licensing, OSHA or equivalent workplace rules, and environmental regulations.",
      ],
    },
    {
      id: "listings",
      title: "4. Listing accuracy and prohibited content",
      paragraphs: [
        "Listings must not misrepresent material (e.g., calling quartzite marble), hide structural damage, or omit critical thickness/dimension data. SmartSlab may remove listings that pose safety or compliance risk.",
      ],
    },
    {
      id: "silica",
      title: "5. Silica and fabrication",
      paragraphs: [
        "Cutting, grinding, or polishing stone may generate respirable crystalline silica. Fabrication safety rules (wet cutting, ventilation, respirators) apply at the Buyer's or fabricator's facility — not on SmartSlab's platform.",
        "SmartSlab does not provide fabrication services or on-site safety supervision.",
      ],
    },
    {
      id: "compliance",
      title: "6. Regulatory compliance",
      paragraphs: [
        "Sellers and Buyers are independently responsible for compliance with import/export rules, sales tax, business permits, and consumer protection laws in their jurisdiction. SmartSlab does not provide legal or tax advice.",
      ],
    },
    {
      id: "verification",
      title: "7. Vendor verification",
      paragraphs: [
        "SmartSlab may display verification or Stripe onboarding status to increase trust, but verification does not guarantee workmanship, inventory accuracy, or legal compliance. Always perform your own due diligence.",
      ],
    },
    {
      id: "incidents",
      title: "8. Incidents",
      paragraphs: [
        "Report unsafe listing content or suspected fraud through platform support. For emergencies at a pickup site, contact local emergency services first.",
      ],
    },
  ],
};
