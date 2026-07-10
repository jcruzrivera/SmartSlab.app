import { NextResponse } from "next/server";

import { getClerkUser, getClerkUserId } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db/client";
import {
  getOrCreateCurrentDbUser,
  setStripeCustomerId,
} from "@/lib/db/users";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrigin } from "@/lib/url";

const PLANS = ["pro", "premium"] as const;
const BILLING_CYCLES = ["monthly", "annual"] as const;

type Plan = (typeof PLANS)[number];
type BillingCycle = (typeof BILLING_CYCLES)[number];

const PRICE_MAP: Record<`${Plan}-${BillingCycle}`, string | undefined> = {
  "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
  "pro-annual": process.env.STRIPE_PRICE_PRO_ANNUAL,
  "premium-monthly": process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  "premium-annual": process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
};

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return (
    typeof value === "string" &&
    (BILLING_CYCLES as readonly string[]).includes(value)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const clerkUserId = await getClerkUserId();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const plan =
    typeof body === "object" && body !== null
      ? (body as { plan?: unknown }).plan
      : undefined;
  const billing =
    typeof body === "object" && body !== null
      ? (body as { billing?: unknown }).billing
      : undefined;

  if (!isPlan(plan) || !isBillingCycle(billing)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = PRICE_MAP[`${plan}-${billing}`];
  if (!priceId) {
    return NextResponse.json(
      { error: "This plan is not available yet." },
      { status: 400 },
    );
  }

  const dbUser = await getOrCreateCurrentDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await getClerkUser();
  const email =
    clerkUser?.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  const stripe = getStripe();
  let customerId = dbUser.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      metadata: { clerk_id: clerkUserId },
    });
    customerId = customer.id;
    await setStripeCustomerId(dbUser.id, customerId);
  }

  const origin = await getOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { clerk_id: clerkUserId, plan },
    subscription_data: { metadata: { clerk_id: clerkUserId, plan } },
    success_url: `${origin}/dashboard?upgraded=${plan}`,
    cancel_url: `${origin}/how-it-works?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
