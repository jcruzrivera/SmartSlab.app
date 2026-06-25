/**
 * Transactional email via Resend's HTTP API.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getFrom(): string {
  return process.env.EMAIL_FROM ?? "SmartSlab <onboarding@resend.dev>";
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set; skipped: ${input.subject}`);
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] send failed (${res.status}): ${detail}`);
    }
  } catch (error) {
    console.error("[email] send error:", error);
  }
}

function money(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return `$${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:#1bb0ce;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;font-weight:700">SmartSlab</div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px">
      <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#64748b">SmartSlab | natural stone slabs &amp; remnants marketplace.</p>
    </div>
  </div>`;
}

export type PaymentNotification = {
  slabName: string;
  total: number | string;
  vendorPayout: number | string;
  platformFee: number | string;
  buyer: { email: string; name: string | null };
  vendor: {
    email: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  slabUrl: string;
};

function fullAddress(v: PaymentNotification["vendor"]): string {
  return [v.address, v.city, v.state, v.zip].filter(Boolean).join(", ") || "N/A";
}

export async function sendPaymentNotifications(
  data: PaymentNotification,
): Promise<void> {
  const buyerName = data.buyer.name ?? "there";
  const vendorName = data.vendor.name ?? "the vendor";

  await sendEmail({
    to: data.buyer.email,
    subject: `Your SmartSlab order: ${data.slabName}`,
    html: layout(
      "Payment confirmed",
      `<p>Hi ${buyerName}, your payment of <strong>${money(data.total)}</strong> for
       <strong>${data.slabName}</strong> was received.</p>
       <p>You can now coordinate pickup or delivery with the vendor:</p>
       <ul>
         <li><strong>Vendor:</strong> ${vendorName}</li>
         ${data.vendor.phone ? `<li><strong>Phone:</strong> ${data.vendor.phone}</li>` : ""}
         <li><strong>Email:</strong> ${data.vendor.email}</li>
         <li><strong>Location:</strong> ${fullAddress(data.vendor)}</li>
       </ul>
       <p><a href="${data.slabUrl}">View your order</a></p>`,
    ),
  });

  await sendEmail({
    to: data.vendor.email,
    subject: `You sold a slab: ${data.slabName}`,
    html: layout(
      "You made a sale",
      `<p>Good news, ${vendorName}. <strong>${data.slabName}</strong> just sold.</p>
       <ul>
         <li><strong>Sale total:</strong> ${money(data.total)}</li>
         <li><strong>Platform fee:</strong> ${money(data.platformFee)}</li>
         <li><strong>Your payout:</strong> ${money(data.vendorPayout)}</li>
         <li><strong>Buyer:</strong> ${data.buyer.name ?? data.buyer.email} (${data.buyer.email})</li>
       </ul>
       <p>Your payout is handled automatically by Stripe to your connected account.</p>`,
    ),
  });

  const platformEmail = process.env.PLATFORM_NOTIFICATION_EMAIL;
  if (platformEmail) {
    await sendEmail({
      to: platformEmail,
      subject: `New order: ${data.slabName} (${money(data.total)})`,
      html: layout(
        "New marketplace order",
        `<ul>
           <li><strong>Slab:</strong> ${data.slabName}</li>
           <li><strong>Total:</strong> ${money(data.total)}</li>
           <li><strong>Platform fee:</strong> ${money(data.platformFee)}</li>
           <li><strong>Vendor:</strong> ${vendorName} (${data.vendor.email})</li>
           <li><strong>Buyer:</strong> ${data.buyer.name ?? data.buyer.email} (${data.buyer.email})</li>
         </ul>`,
      ),
    });
  }
}
