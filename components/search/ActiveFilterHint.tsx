"use client";

type ActiveFilterHintProps = {
  query: string;
  filterCount: number;
};

export function ActiveFilterHint({ query, filterCount }: ActiveFilterHintProps) {
  if (!query || filterCount <= 1) {
    return null;
  }

  return (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Search is combined with your active filters. Remove the search chip below
      to clear only “{query}”.
    </p>
  );
}
