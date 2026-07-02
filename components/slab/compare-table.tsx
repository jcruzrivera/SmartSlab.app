"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  COMPARE_CHANGE_EVENT,
  clearGuestCompare,
  readCompareIds,
  removeGuestCompare,
  subscribeGuestStore,
} from "@/lib/marketplace/guest-storage";
import { SlabPhoto } from "@/components/media/slab-photo";
import { formatDimensions, formatLocation, formatSlabPrice, formatSqft } from "@/lib/format";

type CompareSlab = {
  id: string;
  name: string;
  type: string;
  finish: string;
  colorFamily: string | null;
  widthCm: string | null;
  heightCm: string | null;
  thicknessCm: string | null;
  price: string;
  isNegotiable?: boolean;
  city: string | null;
  state: string | null;
  material: { name: string } | null;
  images: { id: string; url: string; isPrimary: boolean }[];
};

export function CompareTable() {
  const [ids, setIds] = useState<string[]>([]);
  const [slabs, setSlabs] = useState<CompareSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function syncIds() {
      setIds(readCompareIds());
    }

    syncIds();
    return subscribeGuestStore(COMPARE_CHANGE_EVENT, syncIds);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCompareSlabs() {
      if (ids.length === 0) {
        if (!cancelled) {
          setSlabs([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `/api/slabs/compare?ids=${ids.slice(0, 4).join(",")}`,
        );
        const data = (await response.json()) as { slabs?: CompareSlab[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load comparison.");
        }

        if (!cancelled) {
          setSlabs(data.slabs ?? []);
          setError(null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setSlabs([]);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Could not load comparison.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCompareSlabs();

    return () => {
      cancelled = true;
    };
  }, [ids]);

  function clear() {
    clearGuestCompare();
  }

  function remove(slabId: string) {
    removeGuestCompare(slabId);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading comparison...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-900/50 dark:bg-red-950/40">
        <p className="font-medium text-red-700 dark:text-red-300">{error}</p>
        <Link
          href="/browse"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Browse slabs
        </Link>
      </div>
    );
  }

  if (slabs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
        <p className="font-medium">No slabs selected</p>
        <p className="mt-2 text-sm text-slate-500">
          Use Compare on a listing to add up to four slabs.
        </p>
        <Link
          href="/browse"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
        >
          Browse slabs
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Comparing {slabs.length} of 4 slabs
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-slate-500 hover:text-[#0d8fa8]"
        >
          Clear comparison
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="w-40 px-4 py-3 text-xs uppercase tracking-wide text-slate-500">
                Detail
              </th>
              {slabs.map((slab) => (
                <th key={slab.id} className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/slab/${slab.id}`} className="hover:text-[#0d8fa8]">
                      {slab.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(slab.id)}
                      className="w-fit text-xs font-medium text-slate-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <CompareRow label="Photo">
              {slabs.map((slab) => {
                const image =
                  slab.images.find((item) => item.isPrimary)?.url ??
                  slab.images[0]?.url;
                return (
                  <td key={slab.id} className="px-4 py-3">
                    {image ? (
                      <SlabPhoto
                        src={image}
                        alt={slab.name}
                        className="aspect-[4/3] w-40 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-40 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                        No photo
                      </div>
                    )}
                  </td>
                );
              })}
            </CompareRow>
            <CompareRow label="Price">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3 font-semibold">
                  {formatSlabPrice(slab.price, slab.isNegotiable)}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Material">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3">
                  {slab.material?.name ?? "Stone"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Dimensions">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3">
                  {formatDimensions(slab.widthCm, slab.heightCm, slab.thicknessCm)}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Area">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3">
                  {formatSqft(slab.widthCm, slab.heightCm) ?? "Not provided"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Finish">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3 capitalize">
                  {slab.finish}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Location">
              {slabs.map((slab) => (
                <td key={slab.id} className="px-4 py-3">
                  {formatLocation(slab.city, slab.state) ?? "Not provided"}
                </td>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th className="bg-slate-50 px-4 py-3 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
        {label}
      </th>
      {children}
    </tr>
  );
}
