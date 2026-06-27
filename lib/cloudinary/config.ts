export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/** Client-safe cloud name for image delivery (must match on server + browser). */
export function getPublicCloudinaryCloudName(): string | undefined {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

export function getCloudinaryCloudName(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
    process.env.CLOUDINARY_CLOUD_NAME
  );
}
