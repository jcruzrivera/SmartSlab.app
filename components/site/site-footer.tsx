import Link from "next/link";

const categories = [
  { slug: "granite", name: "Granite" },
  { slug: "quartz", name: "Quartz" },
  { slug: "quartzite", name: "Quartzite" },
  { slug: "marble", name: "Marble" },
  { slug: "dolomite", name: "Dolomite" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1bb0ce] text-sm font-bold text-white">
              S
            </span>
            <span className="text-base font-semibold tracking-tight">
              SmartSlab
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            The marketplace to buy and sell natural stone slabs and remnants.
          </p>
        </div>

        <FooterColumn title="Marketplace">
          <FooterLink href="/browse">Browse all</FooterLink>
          <FooterLink href="/dashboard/slabs/new">Sell a slab</FooterLink>
          <FooterLink href="/dashboard">Vendor dashboard</FooterLink>
          <FooterLink href="/dashboard/sales">Sales &amp; orders</FooterLink>
          <FooterLink href="/dashboard/payments">Payments</FooterLink>
        </FooterColumn>

        <FooterColumn title="Categories">
          {categories.map((category) => (
            <FooterLink key={category.slug} href={`/browse?material=${category.slug}`}>
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Account">
          <FooterLink href="/sign-in">Sign in</FooterLink>
          <FooterLink href="/sign-up">Create account</FooterLink>
          <FooterLink href="/account">My account</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SmartSlab. All rights reserved.</p>
          <p>Natural stone slabs &amp; remnants marketplace</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-slate-500 transition hover:text-[#0d8fa8] dark:text-slate-400"
      >
        {children}
      </Link>
    </li>
  );
}
