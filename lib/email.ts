import { getResend } from "@/lib/resend";

const FROM_ADDRESS = "Scrollr <hello@scrollr.co>";

// ── HTML Template Wrapper ──

function wrapHtml(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px;">Scrollr</span>
    </div>
    <div style="background:white;border:1px solid #f0f0f0;border-radius:16px;padding:32px;margin-bottom:24px;">
      ${content}
    </div>
    <div style="text-align:center;padding:16px 0;">
      <p style="font-size:11px;color:#bbb;margin:0;">&copy; ${year} Scrollr &middot; scrollr.co</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Email Functions ──

interface OrderDetails {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency?: string;
}

/**
 * Send order confirmation email to the buyer.
 */
export async function sendOrderConfirmation(
  email: string,
  orderDetails: OrderDetails
) {
  try {
    const resend = getResend();
    const { orderNumber, items, subtotal, shippingCost, total, currency = "USD" } =
      orderDetails;

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;border-bottom:1px solid #f5f5f5;">${item.name} x${item.quantity}</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;border-bottom:1px solid #f5f5f5;">${fmt(item.price * item.quantity)}</td>
          </tr>`
      )
      .join("");

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Order Confirmed</h2>
      <p style="margin:0 0 8px 0;color:#888;">Order <strong style="color:#1a1a1a;">#${orderNumber}</strong></p>
      <p style="margin:0 0 24px 0;">Thank you for your purchase! Here's a summary of your order.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        ${itemsHtml}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#888;font-size:13px;">Subtotal</td>
          <td style="padding:4px 0;color:#1a1a1a;font-size:13px;text-align:right;">${fmt(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#888;font-size:13px;">Shipping</td>
          <td style="padding:4px 0;color:#1a1a1a;font-size:13px;text-align:right;">${fmt(shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0 0;color:#1a1a1a;font-size:15px;font-weight:700;border-top:1px solid #f0f0f0;">Total</td>
          <td style="padding:8px 0 0 0;color:#FF6B4A;font-size:15px;font-weight:700;text-align:right;border-top:1px solid #f0f0f0;">${fmt(total)}</td>
        </tr>
      </table>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Order Confirmed #${orderNumber}`,
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

interface ModerationNoticeParams {
  videoTitle: string;
  action: string;
  reason: string;
}

/**
 * Send moderation notice to the creator (approved/rejected/warning).
 */
export async function sendModerationNotice(
  email: string,
  { videoTitle, action, reason }: ModerationNoticeParams
) {
  try {
    const resend = getResend();

    const actionColor =
      action === "approved"
        ? "#22c55e"
        : action === "rejected"
          ? "#ef4444"
          : "#eab308";

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Content Update</h2>
      <p style="margin:0 0 16px 0;">Your video <strong style="color:#1a1a1a;">"${videoTitle}"</strong> has been reviewed.</p>
      <div style="background:#FAFAF8;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:${actionColor};text-transform:capitalize;">${action}</p>
      </div>
      ${reason ? `<p style="margin:0;color:#888;font-size:13px;"><strong style="color:#1a1a1a;">Reason:</strong> ${reason}</p>` : ""}
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Video ${action}: "${videoTitle}"`,
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send moderation notice email:", err);
  }
}

/**
 * Send welcome email to new users.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
    const resend = getResend();

    const displayName = name || "there";

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Welcome to Scrollr!</h2>
      <p style="margin:0 0 16px 0;">Hey ${displayName}, we're excited to have you on board.</p>
      <p style="margin:0 0 24px 0;color:#888;">Scrollr is where creators turn short-form videos into shoppable experiences. Here's how to get started:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;">
            <strong style="color:#FF6B4A;">1.</strong>
            <span style="color:#1a1a1a;margin-left:8px;">Upload your first video</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;">
            <strong style="color:#FF6B4A;">2.</strong>
            <span style="color:#1a1a1a;margin-left:8px;">Tag products to make it shoppable</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#FF6B4A;">3.</strong>
            <span style="color:#1a1a1a;margin-left:8px;">Share your feed and earn commissions</span>
          </td>
        </tr>
      </table>
      <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#FF6B4A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Go to Dashboard</a>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to Scrollr!",
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

interface CreatorApplicationResultParams {
  name: string;
  status: "approved" | "rejected";
  adminNote?: string;
}

/**
 * Send creator application result email (approved/rejected).
 */
export async function sendCreatorApplicationResult(
  email: string,
  { name, status, adminNote }: CreatorApplicationResultParams
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
    const resend = getResend();

    const isApproved = status === "approved";
    const statusColor = isApproved ? "#22c55e" : "#ef4444";

    const content = isApproved
      ? `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Welcome to Scrollr Creators!</h2>
      <p style="margin:0 0 16px 0;">Hey ${name}, great news — your creator application has been <strong style="color:${statusColor};">approved</strong>.</p>
      <p style="margin:0 0 24px 0;color:#888;">You can now upload videos, add products, and start earning. Head to your dashboard to get started.</p>
      <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#FF6B4A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Go to Dashboard</a>
    `
      : `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Application Update</h2>
      <p style="margin:0 0 16px 0;">Hey ${name}, thank you for applying to become a creator on Scrollr.</p>
      <p style="margin:0 0 16px 0;">Unfortunately, your application was <strong style="color:${statusColor};">not approved</strong> at this time.</p>
      ${adminNote ? `<p style="margin:0 0 16px 0;color:#888;font-size:13px;"><strong style="color:#1a1a1a;">Feedback:</strong> ${adminNote}</p>` : ""}
      <p style="margin:0 0 24px 0;color:#888;">You're welcome to reapply at any time. We'd love to see you on the platform.</p>
      <a href="${appUrl}/apply" style="display:inline-block;background-color:#FF6B4A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Apply Again</a>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: isApproved
        ? "You're in! Creator application approved"
        : "Creator application update",
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send creator application result email:", err);
  }
}

interface StrikeNoticeParams {
  strikeCount: number;
  action: string;
  reason: string;
}

/**
 * Send strike notification to the user.
 */
export async function sendStrikeNotice(
  email: string,
  { strikeCount, action, reason }: StrikeNoticeParams
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
    const resend = getResend();

    const severityColor =
      strikeCount >= 3 ? "#ef4444" : strikeCount >= 2 ? "#f97316" : "#eab308";

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Community Guidelines Notice</h2>
      <p style="margin:0 0 16px 0;">Your account has received a strike for violating our community guidelines.</p>
      <div style="background:#FAFAF8;border-radius:8px;padding:16px;margin-bottom:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Strike Count</span><br />
              <span style="font-size:24px;font-weight:700;color:${severityColor};">${strikeCount} / 3</span>
            </td>
            <td style="padding:4px 0;text-align:right;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Action Taken</span><br />
              <span style="font-size:14px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${action}</span>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin:0 0 8px 0;color:#888;font-size:13px;"><strong style="color:#1a1a1a;">Reason:</strong> ${reason}</p>
      ${strikeCount >= 3 ? '<p style="margin:16px 0 0 0;padding:12px;background-color:rgba(239,68,68,0.1);border-radius:8px;color:#ef4444;font-size:13px;font-weight:500;">Your account has been suspended due to repeated violations. Please contact support to appeal.</p>' : `<p style="margin:16px 0 0 0;color:#888;font-size:13px;">Please review our <a href="${appUrl}/guidelines" style="color:#FF6B4A;text-decoration:none;">community guidelines</a> to avoid further strikes.</p>`}
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Account Strike (${strikeCount}/3) - Action Required`,
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send strike notice email:", err);
  }
}

export async function sendMerchantWelcome(
  email: string,
  storeName: string,
  slug: string,
  productCount: number
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
    const resend = getResend();
    const content = `
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Your store is live on Scrollr!</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
        Welcome, <strong>${storeName}</strong>. We've synced <strong>${productCount} products</strong> from your Shopify store.
        Your storefront is already live and ready for customers.
      </p>
      <p style="font-size:13px;color:#888;margin:0 0 4px;">Your storefront URL:</p>
      <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 24px;">${appUrl}/store/${slug}</p>
      <h2 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 12px;">Next steps</h2>
      <ol style="font-size:14px;color:#666;line-height:1.8;margin:0 0 24px;padding-left:20px;">
        <li><strong>Connect Stripe</strong> to start receiving payouts</li>
        <li><strong>Customize your storefront</strong> — choose light or dark theme, add a description</li>
        <li><strong>Invite creators</strong> to make content featuring your products</li>
      </ol>
      <div style="text-align:center;">
        <a href="${appUrl}/merchant" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Go to Dashboard</a>
      </div>
    `;
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your store is live on Scrollr",
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send merchant welcome email:", err);
  }
}

export async function sendStripeConnectReminder(email: string, storeName: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
    const resend = getResend();
    const content = `
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Start receiving payouts</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
        Hey ${storeName}, your Scrollr storefront is live and customers can browse your products.
        Connect your Stripe account so you can start receiving payouts when sales come in.
      </p>
      <div style="text-align:center;">
        <a href="${appUrl}/merchant" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Connect Stripe</a>
      </div>
    `;
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Start receiving payouts on Scrollr",
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send Stripe connect reminder email:", err);
  }
}

export async function sendMerchantNewOrder(
  email: string,
  storeName: string,
  orderNumber: string,
  items: { title: string; quantity: number; price: number }[],
  revenue: number
) {
  try {
    const resend = getResend();
    const itemRows = items.map(i =>
      `<tr><td style="padding:8px 0;font-size:13px;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${i.title} &times; ${i.quantity}</td><td style="padding:8px 0;font-size:13px;color:#1a1a1a;text-align:right;border-bottom:1px solid #f5f5f5;">&euro;${(i.price * i.quantity).toFixed(2)}</td></tr>`
    ).join("");
    const content = `
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">New sale!</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
        ${storeName}, you have a new order on Scrollr.
      </p>
      <div style="background:#FAFAF8;border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="font-size:12px;color:#999;margin:0 0 4px;">Order</p>
        <p style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0;">#${orderNumber}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        ${itemRows}
        <tr><td style="padding:12px 0;font-size:14px;font-weight:600;color:#1a1a1a;">Your revenue</td><td style="padding:12px 0;font-size:14px;font-weight:600;color:#22c55e;text-align:right;">&euro;${revenue.toFixed(2)}</td></tr>
      </table>
      <p style="font-size:13px;color:#888;margin:0 0 4px;">Please fulfill this order from your Shopify admin.</p>
    `;
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `New sale on Scrollr — Order #${orderNumber}`,
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send merchant new order email:", err);
  }
}

export async function sendEmailConfirmation(email: string, confirmUrl: string) {
  try {
    const resend = getResend();
    const content = `
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Confirm your email</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">
        Click the button below to verify your email address and get started on Scrollr.
      </p>
      <div style="text-align:center;">
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Confirm Email</a>
      </div>
      <p style="font-size:12px;color:#bbb;margin:16px 0 0;text-align:center;">If you didn&apos;t create an account, you can ignore this email.</p>
    `;
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Confirm your email — Scrollr",
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send email confirmation:", err);
  }
}

export async function sendOrderShipped(
  email: string,
  orderNumber: string,
  trackingNumber: string | null,
  trackingUrl: string | null,
  items: { title: string; quantity: number }[]
) {
  try {
    const resend = getResend();
    const itemList = items.map(i => `<li style="font-size:13px;color:#666;padding:4px 0;">${i.title} &times; ${i.quantity}</li>`).join("");
    const trackingBlock = trackingNumber
      ? `<div style="background:#FAFAF8;border-radius:8px;padding:16px;margin:0 0 16px;">
          <p style="font-size:12px;color:#999;margin:0 0 4px;">Tracking number</p>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0;">${trackingNumber}</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="font-size:13px;color:#FF6B4A;text-decoration:none;margin-top:8px;display:inline-block;">Track your package &rarr;</a>` : ""}
         </div>`
      : "";
    const content = `
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Your order has shipped!</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
        Great news — order <strong>#${orderNumber}</strong> is on its way.
      </p>
      ${trackingBlock}
      <p style="font-size:13px;color:#888;margin:0 0 8px;">Items in this shipment:</p>
      <ul style="margin:0 0 16px;padding-left:20px;">${itemList}</ul>
    `;
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Your order has shipped — #${orderNumber}`,
      html: wrapHtml(content),
    });
  } catch (err) {
    console.error("Failed to send order shipped email:", err);
  }
}
