"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";

type PreviewRow = {
  name: string;
  material: string;
  type: string;
  width: string;
  height: string;
  price: string;
  quantity: number;
};

type RowError = { row: number; errors: string[] };

type PreviewResult = {
  total: number;
  previewRows: PreviewRow[];
  rowErrors: RowError[];
};

const TEMPLATE_HEADERS =
  "name,material,type,width_in,height_in,thickness_cm,finish,color_family,brand,price,quantity,notes,room_use,negotiable";
const TEMPLATE_SAMPLE =
  'Calacatta White,Quartz,full_slab,126,63,3,Polished,"White, Gold",MSI,850,5,Beautiful movement,kitchen|bathroom,false\n' +
  "Fantasy Brown,Granite,full_slab,110,55,3,Polished,Brown,Unknown,650,3,,kitchen,true";

export default function ImportSlabsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ imported: number; skipped: number } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([`${TEMPLATE_HEADERS}\n${TEMPLATE_SAMPLE}\n`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartslab-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadPreview(selected: File) {
    setLoading(true);
    setError(null);
    setDone(null);
    setPreview(null);
    try {
      const body = new FormData();
      body.append("file", selected);
      body.append("preview", "true");
      const res = await fetch("/api/slabs/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not read the file.");
        return;
      }
      setPreview(data as PreviewResult);
    } catch {
      setError("Could not read the file.");
    } finally {
      setLoading(false);
    }
  }

  function onSelect(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    void loadPreview(selected);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/slabs/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setDone({ imported: data.imported, skipped: data.skipped });
      setPreview(null);
      setFile(null);
    } catch {
      setError("Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/dashboard/slabs" },
          { label: "Bulk import" },
        ]}
      />
      <h1 className="text-2xl font-semibold tracking-tight">Bulk import (CSV)</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Upload a spreadsheet to publish many full slabs at once.
      </p>

      {done ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-700 dark:text-emerald-300">
            Imported {done.imported} listing{done.imported === 1 ? "" : "s"}
            {done.skipped > 0 ? ` · skipped ${done.skipped} with errors` : ""}.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/slabs"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
            >
              View inventory
            </Link>
            <button
              type="button"
              onClick={() => setDone(null)}
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              Import another file
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDrop={(e) => {
              e.preventDefault();
              onSelect(e.dataTransfer.files?.[0] ?? null);
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition hover:border-brand hover:bg-brand/5 dark:border-slate-700"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            />
            <p className="font-medium">
              {file ? file.name : "Drop your CSV file here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">or click to browse</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadTemplate();
              }}
              className="mt-4 text-sm font-medium text-brand-strong underline"
            >
              Download CSV template
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Reading file…</p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {error}
            </p>
          ) : null}

          {preview ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">
                  Preview: {preview.previewRows.length} valid ·{" "}
                  {preview.rowErrors.length} with errors
                </h2>
                {preview.previewRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={loading}
                    className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-60"
                  >
                    Import {preview.previewRows.length} slab
                    {preview.previewRows.length === 1 ? "" : "s"}
                  </button>
                ) : null}
              </div>

              {preview.rowErrors.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {preview.rowErrors.map((e) => (
                    <div
                      key={e.row}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Row {e.row}: {e.errors.join(" · ")}
                    </div>
                  ))}
                </div>
              ) : null}

              {preview.previewRows.length > 0 ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Size (in)</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.previewRows.map((row, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-medium">{row.name}</td>
                          <td className="px-4 py-3 capitalize">{row.material}</td>
                          <td className="px-4 py-3">
                            {row.type === "full_slab" ? "Full" : "Remnant"}
                          </td>
                          <td className="px-4 py-3">
                            {row.width}×{row.height}
                          </td>
                          <td className="px-4 py-3">${row.price}</td>
                          <td className="px-4 py-3">{row.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
