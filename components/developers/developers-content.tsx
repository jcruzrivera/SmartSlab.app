"use client";

import { useEffect, useRef, useState } from "react";

const EMBED_SNIPPET = `<div data-smartslab-store="your-store-slug" data-limit="12"></div>
<script src="https://smartslab.store/embed.js" async></script>`;

const STORES_JSON = `{
  "stores": [
    {
      "slug": "all-in-remodeling",
      "store_name": "All In Remodeling",
      "city": "Miami",
      "state": "FL",
      "slab_count": 12
    }
  ]
}`;

const STORE_JSON = `{
  "vendor": {
    "slug": "all-in-remodeling",
    "store_name": "All In Remodeling",
    "city": "Miami",
    "state": "FL"
  },
  "slabs": [
    {
      "id": "…",
      "name": "Calacatta Gold",
      "material": "marble",
      "type": "full_slab",
      "width_in": 120,
      "height_in": 55,
      "thickness_cm": 3,
      "price_usd": 1800,
      "image_url": "https://…",
      "quantity": 1
    }
  ]
}`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <code>{code}</code>
    </pre>
  );
}

function LivePreview({ demoSlug }: { demoSlug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div data-smartslab-store={demoSlug} data-limit="6" />
    </div>
  );
}

export function DevelopersContent({ demoSlug }: { demoSlug: string | null }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Developers</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
          Show your live SmartSlab inventory anywhere and query public store
          data programmatically. No API key required — everything here is keyed
          by your public store slug.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">
          Embed your storefront
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Paste this snippet into any website (WordPress, Squarespace, plain
          HTML). It renders your available slabs and keeps them in sync
          automatically. Replace <code>your-store-slug</code> with your store
          slug from your account settings.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Snippet
          </span>
          <CopyButton text={EMBED_SNIPPET} label="Copy snippet" />
        </div>
        <div className="mt-2">
          <CodeBlock code={EMBED_SNIPPET} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Options (data attributes)
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <code>data-smartslab-store</code> (required) — your public store
              slug.
            </li>
            <li>
              <code>data-limit</code> — max slabs to show (default 12, max 48).
            </li>
            <li>
              <code>data-material</code> — filter by material slug (e.g.{" "}
              <code>granite</code>, <code>quartz</code>).
            </li>
            <li>
              <code>data-columns</code> — fixed number of grid columns (default:
              responsive auto-fit).
            </li>
          </ul>
        </div>

        {demoSlug ? (
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Live preview
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rendered with the real widget for{" "}
              <code>{demoSlug}</code>.
            </p>
            <div className="mt-3">
              <LivePreview demoSlug={demoSlug} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">
          Public Stores API
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Read-only JSON, CORS-enabled, cached at the edge. Ideal for custom
          integrations that need more control than the widget.
        </p>

        <div className="mt-6 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                GET
              </span>
              <code className="text-sm">/api/v1/public/stores</code>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Directory of public storefronts that have at least one available
              slab.
            </p>
            <div className="mt-3">
              <CodeBlock code={STORES_JSON} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                GET
              </span>
              <code className="text-sm">/api/v1/public/stores/{"{slug}"}</code>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              A single storefront plus its available inventory. Returns 404 for
              unknown or private stores.
            </p>
            <div className="mt-3">
              <CodeBlock code={STORE_JSON} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
