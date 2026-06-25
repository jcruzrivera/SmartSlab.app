export function hasValidClerkConfig(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";

  return publishableKey.startsWith("pk_") && secretKey.startsWith("sk_");
}
