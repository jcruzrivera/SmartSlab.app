"use client";

import { useId, useState } from "react";

import type { FaqItem } from "@/lib/legal/types";

type FaqAccordionProps = {
  items: FaqItem[];
  /** When set, only one panel is open at a time. */
  singleOpen?: boolean;
  className?: string;
};

/**
 * Accessible FAQ accordion for legal and help pages. Reusable anywhere in the
 * app — pass an array of { id, question, answer } items.
 */
export function FaqAccordion({
  items,
  singleOpen = true,
  className = "",
}: FaqAccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      if (singleOpen) {
        if (prev.has(id)) {
          return new Set();
        }
        return new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium transition hover:bg-brand/5"
              >
                <span>{item.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-brand-strong transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
