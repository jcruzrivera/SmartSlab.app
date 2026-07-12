"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/notifications/toast-store";

type EventType = "used" | "sold_offline" | "adjusted";

const bigButton =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";

export function ScanActions({
  slabId,
  initialQuantity,
  initialStatus,
}: {
  slabId: string;
  initialQuantity: number;
  initialStatus: string;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<EventType | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [acted, setActed] = useState(false);

  async function submit(type: EventType, delta?: number, reason?: string) {
    setPending(type);
    try {
      const res = await fetch("/api/inventory/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slabId,
          type,
          note: type === "adjusted" ? reason : note || undefined,
          delta,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        quantity?: number;
        status?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(
          "No se pudo guardar",
          data.error ?? "Intenta de nuevo en un momento.",
        );
        return;
      }

      if (typeof data.quantity === "number") setQuantity(data.quantity);
      if (typeof data.status === "string") setStatus(data.status);
      setActed(true);
      setNote("");
      setShowAdjust(false);
      setAdjustDelta(0);
      setAdjustReason("");

      const label =
        type === "used"
          ? "Slab marcado como usado"
          : type === "sold_offline"
            ? "Marcado como vendido fuera de SmartSlab"
            : "Cantidad ajustada";
      toast.success(label, `Quedan ${data.quantity ?? quantity} en inventario.`);
    } catch {
      toast.error("Sin conexión", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setPending(null);
    }
  }

  const soldOut = status === "sold" || quantity <= 0;

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/60">
        <span className="text-slate-500 dark:text-slate-400">En inventario</span>
        <span className="text-lg font-semibold">{quantity}</span>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Nota (opcional) — ¿En qué proyecto?
        </span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Cocina Herrera…"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <button
        type="button"
        disabled={pending !== null || soldOut}
        onClick={() => submit("used")}
        className={cn(bigButton, "bg-brand text-white hover:bg-brand-strong")}
      >
        {pending === "used" ? "Guardando…" : "Usé este slab"}
      </button>

      <button
        type="button"
        disabled={pending !== null || soldOut}
        onClick={() => submit("sold_offline")}
        className={cn(
          bigButton,
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        )}
      >
        {pending === "sold_offline"
          ? "Guardando…"
          : "Vendido fuera de SmartSlab"}
      </button>

      <button
        type="button"
        disabled={pending !== null}
        onClick={() => setShowAdjust((v) => !v)}
        className={cn(
          bigButton,
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        )}
      >
        Ajustar cantidad
      </button>

      {showAdjust ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Restar uno"
              onClick={() => setAdjustDelta((d) => d - 1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-2xl font-semibold dark:border-slate-700"
            >
              −
            </button>
            <span className="min-w-16 text-center text-2xl font-semibold tabular-nums">
              {adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}
            </span>
            <button
              type="button"
              aria-label="Sumar uno"
              onClick={() => setAdjustDelta((d) => d + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-2xl font-semibold dark:border-slate-700"
            >
              +
            </button>
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Nuevo total: {Math.max(0, quantity + adjustDelta)}
          </p>
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Motivo del ajuste"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={pending !== null || adjustDelta === 0}
            onClick={() => submit("adjusted", adjustDelta, adjustReason)}
            className={cn(
              bigButton,
              "bg-brand text-white hover:bg-brand-strong",
            )}
          >
            {pending === "adjusted" ? "Guardando…" : "Aplicar ajuste"}
          </button>
        </div>
      ) : null}

      <Link
        href={`/dashboard/slabs/${slabId}/edit`}
        className={cn(
          bigButton,
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        )}
      >
        Ver / editar detalles
      </Link>

      {acted ? (
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={`/dashboard/labels/print?ids=${slabId}`}
            className={buttonClasses({ variant: "outline", size: "lg" })}
          >
            Imprimir etiqueta
          </Link>
          <Link
            href="/dashboard/slabs"
            className="text-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            Volver al inventario
          </Link>
        </div>
      ) : null}
    </div>
  );
}
