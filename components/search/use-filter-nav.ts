"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Client helpers to mutate the browse filters, which live entirely in the URL
 * query string. All updates use router.push (shallow, no scroll) so the server
 * component re-runs the search and the link stays shareable.
 */
export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const cloneParams = useCallback(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  /** Toggle a value within a comma-separated multi-select param. */
  const toggleCsv = useCallback(
    (key: string, value: string) => {
      const params = cloneParams();
      const set = new Set(
        (params.get(key)?.split(",") ?? []).map((v) => v.trim()).filter(Boolean),
      );
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      if (set.size > 0) {
        params.set(key, [...set].join(","));
      } else {
        params.delete(key);
      }
      commit(params);
    },
    [cloneParams, commit],
  );

  /** Set or clear a single scalar param. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = cloneParams();
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      commit(params);
    },
    [cloneParams, commit],
  );

  /** Delete one or more params at once. */
  const deleteParams = useCallback(
    (...keys: string[]) => {
      const params = cloneParams();
      for (const key of keys) params.delete(key);
      commit(params);
    },
    [cloneParams, commit],
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { searchParams, toggleCsv, setParam, deleteParams, clearAll };
}
