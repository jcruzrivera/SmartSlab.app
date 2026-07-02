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
  if (typeof error === "object" && error !== null) {
    const record = error as {
      message?: string;
      http_code?: number;
      error?: { message?: string };
    };
    if (record.message) {
      return record.http_code
        ? `${record.message} (HTTP ${record.http_code})`
        : record.message;
    }
    if (record.error?.message) {
      return record.error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

async function uploadToBlob(
  fileName: string,
  buffer: Buffer,
  contentType: string,
) {
  return put(fileName, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function GET(): Promise<NextResponse> {
  const userId = await getClerkUserId();
  const provider = uploadProvider();

  return NextResponse.json({
    cloudinaryConfigured: isCloudinaryConfigured(),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    provider,
    blobFallbackAvailable:
      isCloudinaryConfigured() && Boolean(process.env.BLOB_READ_WRITE_TOKEN),
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
      try {
        const uploaded = await uploadImageToCloudinary(buffer, file.name);
        return NextResponse.json({
          url: uploaded.url,
          provider: "cloudinary",
        });
      } catch (cloudinaryError) {
        console.error("UPLOAD_ERROR cloudinary:", cloudinaryError);

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw cloudinaryError;
        }

        try {
          const blob = await uploadToBlob(file.name, buffer, file.type);
          console.warn("UPLOAD_FALLBACK: cloudinary failed, stored in vercel-blob");
          return NextResponse.json({
            url: blob.url,
            provider: "vercel-blob",
            fallback: true,
          });
        } catch (blobError) {
          console.error("UPLOAD_ERROR blob fallback:", blobError);
          return NextResponse.json(
            {
              error: "Could not upload image.",
              provider: "cloudinary",
              detail: uploadErrorDetail(cloudinaryError),
              fallbackProvider: "vercel-blob",
              fallbackDetail: uploadErrorDetail(blobError),
            },
            { status: 400 },
          );
        }
      }
    }

    const blob = await uploadToBlob(file.name, buffer, file.type);

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
