import { NextResponse } from "next/server";

import { parseCsv } from "@/lib/csv";
import { getDb, isDbConfigured } from "@/lib/db/client";
import { listMaterials } from "@/lib/db/materials";
import { finishTypeEnum, slabs, slabTypeEnum } from "@/lib/db/schema";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

const FINISHES = new Set<string>(finishTypeEnum.enumValues);
const TYPES = new Set<string>(slabTypeEnum.enumValues);

type ParsedRow = {
  vendorId: string;
  name: string;
  materialId: string | null;
  type: "full_slab" | "remnant";
  widthCm: string | null;
  heightCm: string | null;
  thicknessCm: string;
  finish: (typeof finishTypeEnum.enumValues)[number];
  colorFamily: string | null;
  brandSupplier: string | null;
  price: string;
  pricePerSqft: string | null;
  quantity: number;
  notes: string | null;
  roomUse: string[];
  isNegotiable: boolean;
  status: "available";
};

type PreviewRow = {
  name: string;
  material: string;
  type: string;
  width: string;
  height: string;
  price: string;
  quantity: number;
};

function pricePerSqft(price: number, w: number, h: number): string | null {
  if (!w || !h || w <= 0 || h <= 0) return null;
  const sqft = (w * h) / 144;
  return sqft > 0 ? (price / sqft).toFixed(2) : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database is not connected." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const preview = formData.get("preview") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No CSV file uploaded." }, { status: 400 });
  }

  const text = await file.text();
  const records = parseCsv(text);

  if (records.length === 0) {
    return NextResponse.json({ error: "The CSV has no rows." }, { status: 400 });
  }

  const materials = await listMaterials();
  const materialByKey = new Map<string, string>();
  for (const material of materials) {
    materialByKey.set(material.slug.toLowerCase(), material.id);
    materialByKey.set(material.name.toLowerCase(), material.id);
  }
  const materialNames = materials.map((m) => m.name).join(", ");

  const validRows: ParsedRow[] = [];
  const previewRows: PreviewRow[] = [];
  const rowErrors: { row: number; errors: string[] }[] = [];

  records.forEach((row, index) => {
    const errors: string[] = [];

    const name = row.name?.trim();
    if (!name) errors.push("name is required");

    const type = row.type?.toLowerCase();
    if (!TYPES.has(type)) errors.push("type must be full_slab or remnant");

    const materialId = materialByKey.get(row.material?.toLowerCase() ?? "");
    if (!materialId) {
      errors.push(`unknown material "${row.material}" (use: ${materialNames})`);
    }

    const width = Number(row.width_in);
    if (!row.width_in || Number.isNaN(width)) {
      errors.push("width_in must be a number");
    }
    const height = Number(row.height_in);
    if (!row.height_in || Number.isNaN(height)) {
      errors.push("height_in must be a number");
    }
    const price = Number(row.price);
    if (!row.price || Number.isNaN(price) || price <= 0) {
      errors.push("price must be a positive number");
    }

    if (errors.length > 0) {
      rowErrors.push({ row: index + 2, errors }); // +2: header row + 1-index
      return;
    }

    const quantity =
      type === "remnant"
        ? 1
        : Math.max(1, Math.min(999, parseInt(row.quantity, 10) || 1));
    const thickness = Number(row.thickness_cm);
    const finishRaw = row.finish?.toLowerCase();
    const finish = (FINISHES.has(finishRaw) ? finishRaw : "polished") as ParsedRow["finish"];

    validRows.push({
      vendorId: user.id,
      name: name!,
      materialId: materialId!,
      type: type as "full_slab" | "remnant",
      widthCm: row.width_in,
      heightCm: row.height_in,
      thicknessCm: Number.isNaN(thickness) ? "3" : String(thickness),
      finish,
      colorFamily: row.color_family?.trim() || null,
      brandSupplier: row.brand?.trim() || null,
      price: String(price),
      pricePerSqft: pricePerSqft(price, width, height),
      quantity,
      notes: row.notes?.trim() || null,
      roomUse: row.room_use
        ? row.room_use
            .split("|")
            .map((r) => r.trim())
            .filter(Boolean)
        : [],
      isNegotiable: row.negotiable?.toLowerCase() === "true",
      status: "available",
    });

    previewRows.push({
      name: name!,
      material: row.material,
      type: type as string,
      width: row.width_in,
      height: row.height_in,
      price: String(price),
      quantity,
    });
  });

  if (preview) {
    return NextResponse.json({
      total: records.length,
      previewRows,
      rowErrors,
    });
  }

  if (validRows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows to import.", rowErrors },
      { status: 400 },
    );
  }

  const db = getDb();
  const inserted = await db
    .insert(slabs)
    .values(validRows)
    .returning({ id: slabs.id });

  return NextResponse.json({
    imported: inserted.length,
    skipped: rowErrors.length,
    rowErrors,
  });
}
