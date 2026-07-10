"use client";

import Link from "next/link";
import { useId, useState } from "react";

import styles from "./how-it-works.module.css";

const FAQ_ITEMS = [
  {
    id: "free",
    question: "Is SmartSlab free for trade accounts?",
    answer:
      "Yes. Browsing and purchasing on SmartSlab is free for trade buyers — you only pay for the slabs you purchase at checkout. Vendor subscriptions are optional and unlock higher inventory and SmartFinder limits.",
  },
  {
    id: "sell",
    question: "How do I start selling on SmartSlab?",
    answer:
      "Create an account, list your first slab from the vendor dashboard, and connect Stripe under Payments to receive payouts when you sell.",
  },
  {
    id: "materials",
    question: "What materials are available on SmartSlab?",
    answer:
      "Granite, quartz, quartzite, marble, dolomite, and more — listed as full slabs or unique remnants with photos, dimensions, and location.",
  },
  {
    id: "pickup",
    question: "Can I arrange pickup or local delivery?",
    answer:
      "Yes. After your payment is processed, the seller's contact details and pickup location are unlocked so you can coordinate logistics directly.",
  },
  {
    id: "payments",
    question: "How are payments processed?",
    answer:
      "Checkout runs through Stripe. SmartSlab collects payment, applies a platform fee, and transfers the seller's share to their connected Stripe account.",
  },
] as const;

export function HowItWorksFaq() {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <div className={styles.faqSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.pill}>FAQ</span>
        <h2>Common Questions</h2>
      </div>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          const panelId = `${baseId}-${item.id}-panel`;
          const buttonId = `${baseId}-${item.id}-button`;

          return (
            <div key={item.id} className={styles.faqItem}>
              <button
                id={buttonId}
                type="button"
                className={styles.faqButton}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span>{item.question}</span>
                <span className={styles.faqToggle} aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.faqAnswer}
                >
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className={styles.faqMore}>
        More answers in our{" "}
        <Link href="/faq">full FAQ</Link> and{" "}
        <Link href="/legal">Legal center</Link>.
      </p>
    </div>
  );
}
