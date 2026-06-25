import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";

const SLAB_ID = process.argv[2] ?? "e65ca7f0-2e95-4efa-99dd-b9dd31bf97f9";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = neon(url);

  console.log("=== Users ===");
  const users = await sql`
    SELECT id, email, role, company_name, stripe_account_id, is_verified
    FROM users ORDER BY created_at
  `;
  for (const u of users) {
    console.log(
      `- ${u.email} | role=${u.role} | company=${u.company_name ?? "-"} | stripe=${u.stripe_account_id ?? "NULL"} | verified=${u.is_verified}`,
    );
  }

  console.log(`\n=== Slab ${SLAB_ID} ===`);
  const slabs = await sql`
    SELECT s.id, s.name, s.status, s.vendor_id,
           u.email AS vendor_email, u.company_name AS vendor_company,
           u.stripe_account_id AS vendor_stripe
    FROM slabs s
    LEFT JOIN users u ON u.id = s.vendor_id
    WHERE s.id = ${SLAB_ID}
  `;
  if (slabs.length === 0) {
    console.log("Slab not found.");
  } else {
    const s = slabs[0];
    console.log(
      `name=${s.name}\nstatus=${s.status}\nvendor=${s.vendor_email} (${s.vendor_company ?? "-"})\nvendor_stripe_account_id=${s.vendor_stripe ?? "NULL"}`,
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  console.log(`\nSTRIPE_SECRET_KEY present locally: ${secret ? "yes" : "no"}`);

  const accountId = slabs[0]?.vendor_stripe as string | undefined;
  if (secret && accountId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      const account = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ["configuration.recipient", "requirements"],
      });
      const transfers =
        account?.configuration?.recipient?.capabilities?.stripe_balance
          ?.stripe_transfers?.status;
      console.log(`\n=== Stripe account ${accountId} ===`);
      console.log(`stripe_transfers.status = ${transfers ?? "unknown"}`);
      console.log(
        `requirements.summary = ${JSON.stringify(account.requirements?.summary ?? null)}`,
      );
    } catch (error) {
      console.log(
        `\nStripe retrieve failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
