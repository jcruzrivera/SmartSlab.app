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

function uploadProvider(): "cloudinary" | "vercel-blob" | null {
  if (isCloudinaryConfigured()) {
    return "cloudinary";
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return "vercel-blob";
  }
  return null;
}

function uploadErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function GET(): Promise<NextResponse> {
  const userId = await getClerkUserId();
  const provider = uploadProvider();

  return NextResponse.json({
    cloudinaryConfigured: isCloudinaryConfigured(),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    provider,
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

  const provider = uploadProvider();

  if (!provider) {
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
    if (provider === "cloudinary") {
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
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      url: blob.url,
      provider: "vercel-blob",
    });
  } catch (error) {
    // Temporary: expose provider + detail in logs/response for production diagnosis.
    console.error("UPLOAD_ERROR:", { provider, error });
    return NextResponse.json(
      {
        error: "Could not upload image.",
        detail: uploadErrorDetail(error),
        provider,
      },
      { status: 400 },
    );
  }
}
