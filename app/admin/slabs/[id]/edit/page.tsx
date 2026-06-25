import { redirect } from "next/navigation";

import { SlabForm, type SlabFormInitialValues } from "@/components/slab/slab-form";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { getSlabById } from "@/lib/db/slabs";
import { getCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

type AdminEditSlabPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditSlabPage({
  params,
}: AdminEditSlabPageProps) {
  const user = isDbConfigured() ? await getCurrentDbUser() : null;

  if (!user || user.role !== "admin") {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const [slab, materials] = await Promise.all([getSlabById(id), listMaterials()]);

  if (!slab) {
    redirect("/admin");
  }

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
    widthCm: slab.widthCm,
    heightCm: slab.heightCm,
    thicknessCm: slab.thicknessCm,
    price: slab.price,
    quantity: slab.quantity,
    isNegotiable: slab.isNegotiable,
    notes: slab.notes,
    imageUrls: slab.images.map((image) => image.url),
    roomUse: slab.roomUse,
    aestheticTags: slab.aestheticTags,
    status: slab.status,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Edit listing" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Edit listing</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Admin changes update the public marketplace listing.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <SlabForm
          mode="admin"
          slabId={slab.id}
          materials={materials}
          initialValues={initialValues}
        />
      </div>
    </main>
  );
}
