import { notFound } from "next/navigation";

import { SlabForm, type SlabFormInitialValues } from "@/components/slab/slab-form";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { getSlabForVendor } from "@/lib/db/slabs";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

type EditSlabPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSlabPage({ params }: EditSlabPageProps) {
  const { id } = await params;

  if (!isDbConfigured()) {
    notFound();
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    notFound();
  }

  const slab = await getSlabForVendor(id, user.id);

  if (!slab) {
    notFound();
  }

  const materials = await listMaterials();

  const imageUrls = slab.images
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((image) => image.url);

  const initialValues: SlabFormInitialValues = {
    name: slab.name,
    type: slab.type,
    materialId: slab.materialId,
    finish: slab.finish,
    colorFamily: slab.colorFamily,
    brandSupplier: slab.brandSupplier,
    city: slab.city,
    state: slab.state,
    zip: slab.zip,
    widthIn: slab.widthIn,
    heightIn: slab.heightIn,
    thicknessCm: slab.thicknessCm,
    price: slab.price,
    quantity: slab.quantity,
    isNegotiable: slab.isNegotiable,
    notes: slab.notes,
    imageUrls,
    roomUse: slab.roomUse,
    aestheticTags: slab.aestheticTags,
    status: slab.status,
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/dashboard/slabs" },
          { label: "Edit listing" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Edit listing
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Update photos, dimensions, price, and location for your slab.
      </p>

      <div className="mt-6">
        <SlabForm
          mode="edit"
          slabId={slab.id}
          initialValues={initialValues}
          materials={materials.map((m) => ({ id: m.id, name: m.name }))}
        />
      </div>
    </main>
  );
}
