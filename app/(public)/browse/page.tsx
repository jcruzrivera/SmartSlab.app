import { FilterChips } from "@/components/search/FilterChips";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { GeoProvider } from "@/components/search/GeoProvider";
import { GeoPrompt } from "@/components/search/GeoPrompt";
import { GeoSlabGrid } from "@/components/search/GeoSlabGrid";
import { MobileFilters } from "@/components/search/MobileFilters";
import { SearchBar } from "@/components/search/SearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { searchSlabs } from "@/lib/db/search";
import {
  buildActiveChips,
  countActiveFilters,
  parseFilters,
} from "@/lib/search/filters";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Browse slabs</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The marketplace database is not connected yet. Add the
          <span className="mx-1 font-mono">DATABASE_URL</span>
          environment variable to start showing live inventory.
        </p>
      </main>
    );
  }

  const filters = parseFilters(toSearchParams(await searchParams));

  const [materials, result] = await Promise.all([
    listMaterials(),
    searchSlabs(filters),
  ]);

  const materialLabels = Object.fromEntries(
    materials.map((material) => [material.slug, material.name]),
  );
  const brandLabels = Object.fromEntries(
    result.brandOptions.map((brand) => [brand.value, brand.label]),
  );

  const chips = buildActiveChips(filters, {
    material: materialLabels,
    brand: brandLabels,
  });
  const activeCount = countActiveFilters(filters);

  // Autocomplete suggestions: material names + listing names + brands.
  const suggestionSet = new Map<string, string>();
  for (const material of materials) {
    suggestionSet.set(material.name.toLowerCase(), material.name);
  }
  for (const slab of result.slabs) {
    suggestionSet.set(slab.name.toLowerCase(), slab.name);
  }
  for (const brand of result.brandOptions) {
    suggestionSet.set(brand.label.toLowerCase(), brand.label);
  }
  const suggestions = [...suggestionSet.values()]
    .slice(0, 80)
    .map((label) => ({ label, value: label }));

  const sidebar = (
    <FilterSidebar
      filters={filters}
      materials={materials}
      brandOptions={result.brandOptions}
      facets={result.facets}
    />
  );

  return (
    <GeoProvider>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Browse slabs</h1>
          <SearchBar initialQuery={filters.q} suggestions={suggestions} />
          <GeoPrompt />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">{sidebar}</div>
          </aside>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MobileFilters activeCount={activeCount}>
                  {sidebar}
                </MobileFilters>
                <span className="text-sm text-slate-500">
                  {result.total} result{result.total === 1 ? "" : "s"}
                </span>
              </div>
              <SortSelect value={filters.sort} />
            </div>

            <FilterChips chips={chips} />

            <GeoSlabGrid slabs={result.slabs} />
          </section>
        </div>
      </main>
    </GeoProvider>
  );
}
