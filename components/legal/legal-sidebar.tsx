import Link from "next/link";

import { LEGAL_NAV } from "@/lib/legal/nav";

export function LegalSidebar({ currentPath }: { currentPath: string }) {
  return (
    <nav
      aria-label="Legal center"
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-strong">
        Legal center
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {LEGAL_NAV.map((item) => {
          const active = currentPath === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand/10 font-medium text-brand-strong"
                    : "text-slate-600 hover:bg-brand/5 hover:text-brand-strong dark:text-slate-300"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
