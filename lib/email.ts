import { getResend } from "@/lib/resend";

const FROM_ADDRESS = "Scrollr <notifications@scrollr.io>";

// ── HTML Template Wrapper ──

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#18181b;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <span style="font-size:24px;font-weight:700;color:#c8ff00;letter-spacing:-0.5px;">Scrollr</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 32px 32px 32px;color:#fafafa;font-size:14px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);color:#71717a;font-size:12px;line-height:1.5;">
              You're receiving this because you have an account on Scrollr.<br />
              <a href="https://scrollr.io" style="color:#c8ff00;text-decoration:none;">scrollr.io</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
            <td style="padding:8px 0;color:#fafafa;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.05);">${item.name} x${item.quantity}</td>
            <td style="padding:8px 0;color:#fafafa;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);">${fmt(item.price * item.quantity)}</td>
          </tr>`
      )
      .join("");

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#fafafa;">Order Confirmed</h2>
      <p style="margin:0 0 8px 0;color:#71717a;">Order <strong style="color:#fafafa;">#${orderNumber}</strong></p>
      <p style="margin:0 0 24px 0;">Thank you for your purchase! Here's a summary of your order.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        ${itemsHtml}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#71717a;font-size:13px;">Subtotal</td>
          <td style="padding:4px 0;color:#fafafa;font-size:13px;text-align:right;">${fmt(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#71717a;font-size:13px;">Shipping</td>
          <td style="padding:4px 0;color:#fafafa;font-size:13px;text-align:right;">${fmt(shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0 0;color:#fafafa;font-size:15px;font-weight:700;border-top:1px solid rgba(255,255,255,0.08);">Total</td>
          <td style="padding:8px 0 0 0;color:#c8ff00;font-size:15px;font-weight:700;text-align:right;border-top:1px solid rgba(255,255,255,0.08);">${fmt(total)}</td>
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
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#fafafa;">Content Update</h2>
      <p style="margin:0 0 16px 0;">Your video <strong style="color:#fafafa;">"${videoTitle}"</strong> has been reviewed.</p>
      <div style="background-color:#27272a;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px 0;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:${actionColor};text-transform:capitalize;">${action}</p>
      </div>
      ${reason ? `<p style="margin:0;color:#71717a;font-size:13px;"><strong style="color:#fafafa;">Reason:</strong> ${reason}</p>` : ""}
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
    const resend = getResend();

    const displayName = name || "there";

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#fafafa;">Welcome to Scrollr!</h2>
      <p style="margin:0 0 16px 0;">Hey ${displayName}, we're excited to have you on board.</p>
      <p style="margin:0 0 24px 0;color:#71717a;">Scrollr is where creators turn short-form videos into shoppable experiences. Here's how to get started:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#c8ff00;">1.</strong>
            <span style="color:#fafafa;margin-left:8px;">Upload your first video</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#c8ff00;">2.</strong>
            <span style="color:#fafafa;margin-left:8px;">Tag products to make it shoppable</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#c8ff00;">3.</strong>
            <span style="color:#fafafa;margin-left:8px;">Share your feed and earn commissions</span>
          </td>
        </tr>
      </table>
      <a href="https://scrollr.io/dashboard" style="display:inline-block;background-color:#c8ff00;color:#09090b;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Go to Dashboard</a>
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
    const resend = getResend();

    const severityColor =
      strikeCount >= 3 ? "#ef4444" : strikeCount >= 2 ? "#f97316" : "#eab308";

    const content = `
      <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#fafafa;">Community Guidelines Notice</h2>
      <p style="margin:0 0 16px 0;">Your account has received a strike for violating our community guidelines.</p>
      <div style="background-color:#27272a;border-radius:8px;padding:16px;margin-bottom:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;">
              <span style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Strike Count</span><br />
              <span style="font-size:24px;font-weight:700;color:${severityColor};">${strikeCount} / 3</span>
            </td>
            <td style="padding:4px 0;text-align:right;">
              <span style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Action Taken</span><br />
              <span style="font-size:14px;font-weight:600;color:#fafafa;text-transform:capitalize;">${action}</span>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin:0 0 8px 0;color:#71717a;font-size:13px;"><strong style="color:#fafafa;">Reason:</strong> ${reason}</p>
      ${strikeCount >= 3 ? '<p style="margin:16px 0 0 0;padding:12px;background-color:rgba(239,68,68,0.1);border-radius:8px;color:#ef4444;font-size:13px;font-weight:500;">Your account has been suspended due to repeated violations. Please contact support to appeal.</p>' : '<p style="margin:16px 0 0 0;color:#71717a;font-size:13px;">Please review our <a href="https://scrollr.io/guidelines" style="color:#c8ff00;text-decoration:none;">community guidelines</a> to avoid further strikes.</p>'}
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
