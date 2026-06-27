import { v2 as cloudinary } from "cloudinary";

import { isCloudinaryConfigured } from "@/lib/cloudinary/config";

let configured = false;

function ensureCloudinaryConfigured(): typeof cloudinary {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  const client = ensureCloudinaryConfigured();
  const safeName = filename.replace(/[^\w.-]+/g, "-").slice(0, 80);

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: "smartslab/slabs",
        public_id: `${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`,
        overwrite: false,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}
