import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getClerkUserId } from "@/lib/auth/session";
import { isCloudinaryConfigured } from "@/lib/cloudinary/config";
import { uploadImageToCloudinary } from "@/lib/cloudinary/upload";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function GET(): Promise<NextResponse> {
  const userId = await getClerkUserId();

  return NextResponse.json({
    cloudinaryConfigured: isCloudinaryConfigured(),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    signedIn: Boolean(userId),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await getClerkUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to upload images." },
      { status: 401 },
    );
  }

  if (!isCloudinaryConfigured() && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Image storage is not configured. Add Cloudinary or BLOB_READ_WRITE_TOKEN.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, and GIF images are allowed." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 10MB or smaller." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (isCloudinaryConfigured()) {
      const uploaded = await uploadImageToCloudinary(buffer, file.name);
      return NextResponse.json({
        url: uploaded.url,
        provider: "cloudinary",
      });
    }

    const blob = await put(file.name, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      provider: "vercel-blob",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not upload image.",
      },
      { status: 400 },
    );
  }
}
