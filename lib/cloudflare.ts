import crypto from "crypto";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CLOUDFLARE_STREAM_API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

async function cfFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
      ...options.headers,
    },
  });
  return res.json() as Promise<{ success: boolean; result: Record<string, unknown>; errors: unknown[] }>;
}

export async function createDirectUploadUrl(): Promise<{
  uploadUrl: string;
  streamMediaId: string;
}> {
  const data = await cfFetch("/direct_upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maxDurationSeconds: 300,
      requireSignedURLs: false,
    }),
  });

  if (!data.success) {
    throw new Error("Failed to create Cloudflare upload URL");
  }

  return {
    uploadUrl: data.result.uploadURL as string,
    streamMediaId: data.result.uid as string,
  };
}

export async function getVideoDetails(streamMediaId: string) {
  const data = await cfFetch(`/${streamMediaId}`);

  if (!data.success) {
    return null;
  }

  const result = data.result;
  const playback = result.playback as { hls?: string; dash?: string } | undefined;
  const thumbnail = result.thumbnail as string | undefined;
  const duration = result.duration as number | undefined;

  return {
    hlsUrl: playback?.hls ?? null,
    dashUrl: playback?.dash ?? null,
    thumbnailUrl: thumbnail ?? null,
    duration: duration ?? null,
    status: (result.status as { state?: string })?.state ?? "unknown",
  };
}

function timingSafeEqualText(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Verifies Cloudflare webhook authenticity.
 * Supports HMAC signatures and legacy shared-secret header.
 */
export function verifyCloudflareWebhook(body: string, headers: Headers): boolean {
  const secret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader =
    headers.get("webhook-signature") ??
    headers.get("cf-webhook-signature") ??
    headers.get("x-webhook-signature");

  if (signatureHeader) {
    const expectedHex = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");
    const expectedBase64 = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    const rawCandidates = signatureHeader
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const candidates = new Set<string>();
    for (const candidate of rawCandidates) {
      if (candidate.startsWith("v1=")) {
        candidates.add(candidate.slice(3));
      } else if (candidate.startsWith("sha256=")) {
        candidates.add(candidate.slice(7));
      } else if (!candidate.startsWith("t=")) {
        candidates.add(candidate);
      }
    }

    for (const candidate of Array.from(candidates)) {
      if (
        timingSafeEqualText(candidate, expectedHex) ||
        timingSafeEqualText(candidate, expectedBase64)
      ) {
        return true;
      }
    }
    return false;
  }

  // Backward-compatible fallback for previously configured static secret header.
  const legacySecret = headers.get("webhook-secret");
  if (!legacySecret) return false;
  return timingSafeEqualText(legacySecret, secret);
}
