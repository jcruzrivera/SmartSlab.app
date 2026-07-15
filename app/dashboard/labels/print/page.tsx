import { redirect } from "next/navigation";

import { AutoPrint } from "@/components/inventory/auto-print";
import { isDbConfigured } from "@/lib/db/client";
import { getSlabForVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { formatDimensions } from "@/lib/format";
import { qrSvg } from "@/lib/inventory/qr";
import { getOrigin } from "@/lib/url";

export const dynamic = "force-dynamic";

type Label = {
  id: string;
  name: string;
  shortCode: string;
  material: string;
  dims: string;
  qr: string;
};

export default async function LabelPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  if (!isDbConfigured()) {
    redirect("/dashboard/slabs");
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { ids } = await searchParams;
  const requestedIds = (ids ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const origin = await getOrigin();
  const labels: Label[] = [];

  for (const id of requestedIds) {
    const slab = await getSlabForVendor(id, user.id);
    if (!slab || !slab.shortCode) {
      continue;
    }
    labels.push({
      id: slab.id,
      name: slab.name,
      shortCode: slab.shortCode,
      material: slab.material?.name ?? "Stone",
      dims: formatDimensions(slab.widthIn, slab.heightIn, slab.thicknessCm),
      qr: await qrSvg(`${origin}/s/${slab.shortCode}`),
    });
  }

  if (labels.length === 0) {
    return (
      <section className="mx-auto w-full max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Sin etiquetas para imprimir</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          No encontramos slabs con código asignado para estos identificadores.
        </p>
      </section>
    );
  }

  return (
    <div className="labels-print-root">
      <AutoPrint />

      <div className="labels-note print:hidden">
        <p>
          <strong>{labels.length}</strong> etiqueta
          {labels.length === 1 ? "" : "s"} lista
          {labels.length === 1 ? "" : "s"}. El diálogo de impresión se abre solo;
          usa hojas adhesivas de 4&quot; × 2&quot; (10 por hoja carta).
        </p>
        <p className="labels-note-tip">
          Recomendamos papel adhesivo laminado o cinta transparente encima — las
          bodegas son polvorientas.
        </p>
      </div>

      <div className="labels-sheet">
        {labels.map((label) => (
          <div key={label.id} className="label">
            <div
              className="label-qr"
              // qrSvg returns a trusted, server-generated SVG string.
              dangerouslySetInnerHTML={{ __html: label.qr }}
            />
            <div className="label-body">
              <div className="label-name">{label.name}</div>
              <div className="label-code">{label.shortCode}</div>
              <div className="label-meta">
                {label.material}
                {label.dims && label.dims !== "Dimensions not provided"
                  ? ` · ${label.dims}`
                  : ""}
              </div>
              <div className="label-domain">smartslab.store</div>
            </div>
          </div>
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Force light print surface — app dark mode must not ink the sticker. */
        .labels-print-root,
        .labels-print-root * {
          color-scheme: only light;
        }
        .labels-note {
          max-width: 42rem;
          margin: 1.5rem auto;
          padding: 0 1.5rem;
          font-size: 0.875rem;
          color: #475569;
        }
        .labels-note-tip { margin-top: 0.5rem; color: #64748b; }
        .labels-sheet {
          display: grid;
          grid-template-columns: repeat(2, 4in);
          grid-auto-rows: 2in;
          gap: 0;
          justify-content: center;
          margin: 0 auto;
          background: #ffffff;
        }
        .label {
          box-sizing: border-box;
          width: 4in;
          height: 2in;
          display: flex;
          align-items: center;
          gap: 0.18in;
          padding: 0.16in;
          overflow: hidden;
          border: 1px dashed #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .label-qr {
          width: 1.2in;
          height: 1.2in;
          flex: 0 0 1.2in;
          background: #ffffff;
        }
        .label-qr svg {
          width: 100%;
          height: 100%;
          display: block;
          background: #ffffff;
        }
        .label-body {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.03in;
          color: #0f172a;
        }
        .label-name {
          font-weight: 700;
          font-size: 12pt;
          line-height: 1.1;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .label-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 18pt;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .label-meta { font-size: 8pt; color: #334155; }
        .label-domain { font-size: 8pt; color: #64748b; margin-top: 0.02in; }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .label { border: none; background: #ffffff !important; }
          .labels-sheet { gap: 0; background: #ffffff !important; }
          .label-qr, .label-qr svg { background: #ffffff !important; }
        }
        @page { margin: 0; size: letter; }
      `,
        }}
      />
    </div>
  );
}
