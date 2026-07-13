/**
 * Complimentary access allowlists.
 *
 * These grants are applied purely at runtime (see `effectivePlanForUser` in
 * `./limits`). They never touch the database or Stripe, so subscription
 * webhooks can't overwrite them and the accounts stay 100% operational in the
 * marketplace — only subscription-gated features are unlocked.
 *
 * - Partners: lifetime full-features access, equivalent to the `premium` tier.
 * - Collaborators: a time-limited free `pro` grant that expires automatically.
 */

/** Lifetime, full-features (premium-equivalent) partner Clerk user IDs. */
const PARTNER_CLERK_IDS_STATIC = [
  "user_3Fup4yqXpzi7jh5AO1g7Jso8B2D",
  "user_3Fvh0zDON1e3h1rR0cakAkPqzRr",
  "user_3G1aG921I3ZL3jxuSRtnX8rFstI",
] as const;

/**
 * Extra partner IDs via env (comma-separated) so new partners can be added
 * without a code deploy, e.g. PARTNER_CLERK_IDS="user_a,user_b".
 */
function partnerIdsFromEnv(): string[] {
  return (process.env.PARTNER_CLERK_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

const PARTNER_CLERK_IDS = new Set<string>([
  ...PARTNER_CLERK_IDS_STATIC,
  ...partnerIdsFromEnv(),
]);

/** How long the collaborator Pro grant lasts, in months. */
const COLLABORATOR_PRO_MONTHS = 6;

/**
 * Collaborators who get free `pro` features for `COLLABORATOR_PRO_MONTHS`
 * starting at `grantedAt` (ISO date). After that window they revert to their
 * real plan automatically.
 */
const COLLABORATOR_PRO: Record<string, { grantedAt: string }> = {
  user_3G36TxHtbxQOvX8e9zl65NagSFB: { grantedAt: "2026-07-12" },
  user_3G3utuNDxj8ncaJv7FslFgqNA8Y: { grantedAt: "2026-07-12" },
  user_3G3x4DivlbclxLFyPtFY3sL3ERh: { grantedAt: "2026-07-12" },
  user_3G3zNbvAACgBG06N5CwNcZXWpMz: { grantedAt: "2026-07-12" },
  user_3G49QDE02nEctY5vP5YXSvyaElP: { grantedAt: "2026-07-12" },
};

/** True if the Clerk user is a lifetime full-features partner. */
export function isPartnerClerkId(clerkId?: string | null): boolean {
  if (!clerkId) return false;
  return PARTNER_CLERK_IDS.has(clerkId);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** True while a collaborator's free Pro window is still open. */
export function collaboratorProActive(
  clerkId?: string | null,
  now: Date = new Date(),
): boolean {
  if (!clerkId) return false;
  const grant = COLLABORATOR_PRO[clerkId];
  if (!grant) return false;

  const start = new Date(`${grant.grantedAt}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return false;

  const expiry = addMonths(start, COLLABORATOR_PRO_MONTHS);
  return now.getTime() < expiry.getTime();
}

/** True if the user has any complimentary access (partner or active collaborator). */
export function hasComplimentaryAccess(
  clerkId?: string | null,
  now: Date = new Date(),
): boolean {
  return isPartnerClerkId(clerkId) || collaboratorProActive(clerkId, now);
}
