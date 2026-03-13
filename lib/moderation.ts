import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const POLICY_PROMPT = `You are a content moderation system. Analyze this video frame and determine if it violates any of these policies:

1. Nudity or sexual content
2. Graphic violence or gore
3. Hate symbols or hate speech
4. Self-harm or suicide promotion
5. Child exploitation or endangerment
6. Drug use or drug promotion
7. Terrorism or extremist content

Respond with ONLY valid JSON (no markdown, no code blocks):
{"violates": false}
or
{"violates": true, "category": "category name", "confidence": 0.95}

If the image is safe, respond with violates: false. Only flag clear violations with high confidence.`;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface ModerationResult {
  passed: boolean;
  reason?: string;
  category?: string;
  confidence?: number;
}

/**
 * Moderate a video by analyzing thumbnail frames via OpenAI Vision.
 * Uses Cloudflare Stream thumbnail API to get frames at different timestamps.
 * Returns { passed: true } if safe, { passed: false, reason, category } if violation found.
 *
 * Gracefully degrades: if no OPENAI_API_KEY is set, all videos pass.
 */
export async function moderateVideo(videoId: string): Promise<ModerationResult> {
  const openai = getOpenAIClient();
  if (!openai) {
    // No API key — skip moderation
    return { passed: true };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      cloudflareStreamId: true,
      thumbnailUrl: true,
      duration: true,
      title: true,
      description: true,
    },
  });

  if (!video) {
    return { passed: false, reason: "Video not found" };
  }

  // Text moderation for title and description
  const textResult = await moderateText(
    openai,
    [video.title, video.description].filter(Boolean).join(" ")
  );
  if (textResult && !textResult.passed) {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "REJECTED" },
    });
    return textResult;
  }

  // Generate frame URLs from Cloudflare Stream
  const frameUrls = getFrameUrls(video.cloudflareStreamId, video.thumbnailUrl, video.duration);

  if (frameUrls.length === 0) {
    // Can't extract frames — pass by default
    return { passed: true };
  }

  // Analyze each frame
  let maxConfidence = 0;
  let flaggedResult: ModerationResult | null = null;

  for (const frameUrl of frameUrls) {
    try {
      const result = await analyzeFrame(openai, frameUrl);
      if (result.violates && (result.confidence ?? 0) > maxConfidence) {
        maxConfidence = result.confidence ?? 0;
        flaggedResult = {
          passed: false,
          reason: `Content violation detected: ${result.category}`,
          category: result.category,
          confidence: result.confidence,
        };
      }
    } catch {
      continue;
    }
  }

  if (flaggedResult) {
    const confidence = flaggedResult.confidence ?? 0;

    if (confidence > 0.85) {
      // Auto-reject
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "REJECTED" },
      });
      return flaggedResult;
    } else if (confidence >= 0.5) {
      // Hold for review
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "PENDING_REVIEW" },
      });
      return {
        passed: false,
        reason: `Held for review: ${flaggedResult.category}`,
        category: flaggedResult.category,
        confidence,
      };
    }
  }

  return { passed: true };
}

/**
 * Moderate text content (titles, descriptions, product names) using OpenAI Moderation API.
 */
export async function moderateText(
  openai: OpenAI,
  text: string
): Promise<ModerationResult | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    if (result.flagged) {
      const categories = Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([category]) => category);

      const scores = Object.entries(result.category_scores);
      const maxScore = Math.max(...scores.map(([, score]) => score));

      return {
        passed: false,
        reason: `Text violation: ${categories.join(", ")}`,
        category: categories[0],
        confidence: maxScore,
      };
    }

    return { passed: true };
  } catch {
    return null; // Graceful degradation
  }
}

/**
 * Standalone text moderation check (for product names, etc.)
 */
export async function moderateTextContent(text: string): Promise<ModerationResult> {
  const openai = getOpenAIClient();
  if (!openai) return { passed: true };

  const result = await moderateText(openai, text);
  return result ?? { passed: true };
}

/**
 * Generate frame URLs at even intervals across the video duration.
 */
function getFrameUrls(
  streamId: string | null,
  thumbnailUrl: string | null,
  duration: number | null
): string[] {
  if (!streamId) {
    return thumbnailUrl ? [thumbnailUrl] : [];
  }

  const videoDuration = duration ?? 30;
  const frameCount = Math.min(6, Math.max(2, Math.floor(videoDuration / 5)));
  const interval = videoDuration / (frameCount + 1);

  const urls: string[] = [];
  for (let i = 1; i <= frameCount; i++) {
    const time = Math.floor(interval * i);
    urls.push(
      `https://customer-${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? "unknown"}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg?time=${time}s&width=640`
    );
  }

  return urls;
}

/**
 * Analyze a single frame using OpenAI Vision.
 */
async function analyzeFrame(
  openai: OpenAI,
  imageUrl: string
): Promise<{ violates: boolean; category?: string; confidence?: number }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: POLICY_PROMPT },
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    return { violates: false };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      violates: !!parsed.violates,
      category: parsed.category,
      confidence: parsed.confidence,
    };
  } catch {
    return { violates: false };
  }
}
