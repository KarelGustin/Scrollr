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

export function verifyCloudflareWebhook(
  body: string,
  signature: string
): boolean {
  // TODO: Implement CF-Signature verification using CLOUDFLARE_WEBHOOK_SECRET
  // For MVP, we verify the webhook secret matches
  const secret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
  if (!secret) return false;
  return signature === secret;
}
