"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";

import { DuplicateButton } from "@/components/slab/duplicate-button";
import { Badge, type BadgeVariant, slabStatusVariant } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";

export type InventoryRow = {
  id: string;
  name: string;
  materialName: string;
  dimensions: string;
  price: string;
  status: string;
  hasShortCode: boolean;
};

function editHref(id: string): string {
  return `/dashboard/slabs/${id}/edit`;
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectableIds = useMemo(
    () => rows.filter((row) => row.hasShortCode).map((row) => row.id),
    [rows],
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function printSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    router.push(`/dashboard/labels/print?ids=${ids.join(",")}`);
  }

  function goToEdit(id: string) {
    router.push(editHref(id));
  }

  function onRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "a, button, input, label, [role='button'], [data-row-stop]",
      )
    ) {
      return;
    }
    goToEdit(id);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToEdit(id);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selected.size > 0
            ? `${selected.size} seleccionada${selected.size === 1 ? "" : "s"}`
            : "Selecciona slabs para imprimir sus etiquetas QR."}
        </p>
        <button
          type="button"
          onClick={printSelected}
          disabled={selected.size === 0}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          Imprimir etiquetas
          {selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={selectableIds.length === 0}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Dimensions</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((slab) => (
                <tr
                  key={slab.id}
                  role="link"
                  tabIndex={0}
                  onClick={(event) => onRowClick(event, slab.id)}
                  onKeyDown={(event) => onRowKeyDown(event, slab.id)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3" data-row-stop>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${slab.name}`}
                      checked={selected.has(slab.id)}
                      onChange={() => toggle(slab.id)}
                      disabled={!slab.hasShortCode}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={editHref(slab.id)}
                      className="font-medium hover:text-brand-strong"
                    >
                      {slab.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {slab.materialName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {slab.dimensions}
                  </td>
                  <td className="px-4 py-3 font-medium">{slab.price}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        (slabStatusVariant[slab.status] as BadgeVariant) ??
                        "muted"
                      }
                      className="capitalize"
                    >
                      {slab.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right" data-row-stop>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/labels/print?ids=${slab.id}`}
                        className="text-sm font-medium text-brand-strong hover:underline"
                      >
                        Etiqueta
                      </Link>
                      <DuplicateButton slabId={slab.id} />
                      <Link
                        href={editHref(slab.id)}
                        className="text-sm font-medium text-brand-strong hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
