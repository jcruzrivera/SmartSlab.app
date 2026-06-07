import { redirect } from "next/navigation";

import { getCurrentDbUser } from "@/lib/db/users";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentDbUser();

  if (!user || user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Admin Console</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Platform-level moderation and reporting.
      </p>
    </main>
  );
}
