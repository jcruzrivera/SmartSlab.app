type SlabDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SlabDetailPage({ params }: SlabDetailPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Slab detail</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Dynamic listing route is active for <span className="font-mono">{slug}</span>.
      </p>
    </main>
  );
}
