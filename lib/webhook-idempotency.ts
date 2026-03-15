import { prisma } from "@/lib/prisma";
import type { WebhookProvider } from "@prisma/client";

type StartResult =
  | { shouldProcess: true; recordId: string }
  | { shouldProcess: false };

/**
 * Starts webhook processing in an idempotent way.
 * Duplicate already-processed events are ignored.
 * Previously failed events are retried.
 */
export async function startWebhookEvent(
  provider: WebhookProvider,
  eventId: string
): Promise<StartResult> {
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider, eventId } },
      select: { id: true, status: true },
    });

    if (!existing) {
      try {
        const created = await prisma.webhookEvent.create({
          data: { provider, eventId, status: "PROCESSING" },
          select: { id: true },
        });
        return { shouldProcess: true, recordId: created.id };
      } catch {
        return { shouldProcess: false };
      }
    }

    if (existing.status === "PROCESSED" || existing.status === "PROCESSING") {
      return { shouldProcess: false };
    }

    const retried = await prisma.webhookEvent.update({
      where: { id: existing.id },
      data: { status: "PROCESSING", error: null },
      select: { id: true },
    });
    return { shouldProcess: true, recordId: retried.id };
  } catch {
    // Fallback if table is not migrated yet or DB is temporarily unavailable.
    return { shouldProcess: true, recordId: "" };
  }
}

export async function markWebhookEventSuccess(recordId: string) {
  if (!recordId) return;
  await prisma.webhookEvent.update({
    where: { id: recordId },
    data: { status: "PROCESSED", processedAt: new Date(), error: null },
  });
}

export async function markWebhookEventFailure(recordId: string, error: string) {
  if (!recordId) return;
  await prisma.webhookEvent.update({
    where: { id: recordId },
    data: { status: "FAILED", error: error.slice(0, 1000) },
  });
}
