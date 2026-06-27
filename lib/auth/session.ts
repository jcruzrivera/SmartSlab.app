import { auth, currentUser } from "@clerk/nextjs/server";

import { hasValidClerkConfig } from "@/lib/auth/config";

export async function getClerkUserId(): Promise<string | null> {
  if (!hasValidClerkConfig()) {
    return null;
  }

  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function getClerkUser() {
  if (!hasValidClerkConfig()) {
    return null;
  }

  try {
    return (await currentUser()) ?? null;
  } catch {
    return null;
  }
}
