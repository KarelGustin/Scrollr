import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transferCreatorCommission } from "@/lib/stripe-connect";

/**
 * GET /api/cron/payouts
 *
 * Weekly cron job that processes creator payouts.
 * - Finds all CREATOR_SALE commissions with status PENDING and payableAt <= now
 * - Groups them by creator
 * - Creates a CreatorPayout record per creator
 * - Transfers funds via Stripe Connect
 * - Updates commission statuses to PAID
 *
 * Commissions have a 30-day hold (payableAt) to cover the refund window.
 * This job should run weekly (e.g. every Monday via Vercel Cron or similar).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all eligible commissions (PENDING, past hold period, creator type)
  const eligibleCommissions = await prisma.commission.findMany({
    where: {
      type: "CREATOR_SALE",
      status: "PENDING",
      payableAt: { lte: now },
    },
    include: {
      order: {
        select: { id: true, status: true },
      },
    },
  });

  if (eligibleCommissions.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No eligible commissions to process",
      processedAt: now.toISOString(),
    });
  }

  // Filter out commissions for refunded/cancelled orders (safety check)
  const validCommissions = eligibleCommissions.filter(
    (c) => c.order.status !== "REFUNDED" && c.order.status !== "CANCELLED"
  );

  // Mark commissions for refunded orders as FAILED
  const invalidIds = eligibleCommissions
    .filter((c) => c.order.status === "REFUNDED" || c.order.status === "CANCELLED")
    .map((c) => c.id);

  if (invalidIds.length > 0) {
    await prisma.commission.updateMany({
      where: { id: { in: invalidIds } },
      data: { status: "FAILED" },
    });
  }

  // Group by creator
  const creatorGroups = new Map<
    string,
    { commissions: typeof validCommissions; totalAmount: number }
  >();

  for (const commission of validCommissions) {
    const existing = creatorGroups.get(commission.userId);
    if (existing) {
      existing.commissions.push(commission);
      existing.totalAmount += commission.amount;
    } else {
      creatorGroups.set(commission.userId, {
        commissions: [commission],
        totalAmount: commission.amount,
      });
    }
  }

  const results: Array<{
    userId: string;
    amount: number;
    status: "completed" | "failed" | "skipped";
    reason?: string;
  }> = [];

  for (const [userId, group] of Array.from(creatorGroups.entries())) {
    // Look up creator's Stripe Connect account
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeConnectId: true, stripeConnectOnboarded: true },
    });

    if (!creator?.stripeConnectId || !creator.stripeConnectOnboarded) {
      // Creator hasn't completed Stripe onboarding — skip, they'll be paid next cycle
      results.push({
        userId,
        amount: group.totalAmount,
        status: "skipped",
        reason: "Stripe Connect not onboarded",
      });
      continue;
    }

    const amountCents = Math.round(group.totalAmount * 100);
    if (amountCents < 1) {
      results.push({
        userId,
        amount: group.totalAmount,
        status: "skipped",
        reason: "Amount too small",
      });
      continue;
    }

    // Create payout record
    const payout = await prisma.creatorPayout.create({
      data: {
        userId,
        amount: group.totalAmount,
        currency: "EUR",
        status: "PROCESSING",
        scheduledFor: now,
      },
    });

    try {
      // Transfer to creator via Stripe
      const transfer = await transferCreatorCommission({
        amountCents,
        creatorStripeId: creator.stripeConnectId,
        orderId: group.commissions[0].orderId, // Primary order reference
      });

      // Mark payout and commissions as completed
      const commissionIds = group.commissions.map((c: { id: string }) => c.id);

      await prisma.$transaction([
        prisma.creatorPayout.update({
          where: { id: payout.id },
          data: {
            status: "COMPLETED",
            stripeTransferId: transfer.id,
            processedAt: now,
          },
        }),
        prisma.commission.updateMany({
          where: { id: { in: commissionIds } },
          data: {
            status: "PAID",
            stripeTransferId: transfer.id,
            payoutId: payout.id,
            paidAt: now,
          },
        }),
      ]);

      results.push({ userId, amount: group.totalAmount, status: "completed" });
    } catch (err) {
      console.error(`Payout failed for creator ${userId}:`, err);

      // Mark payout as failed but leave commissions as PENDING for retry
      await prisma.creatorPayout.update({
        where: { id: payout.id },
        data: {
          status: "FAILED",
          failureReason: err instanceof Error ? err.message : "Unknown error",
        },
      });

      results.push({
        userId,
        amount: group.totalAmount,
        status: "failed",
        reason: err instanceof Error ? err.message : "Transfer failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processedAt: now.toISOString(),
    totalEligible: eligibleCommissions.length,
    invalidMarkedFailed: invalidIds.length,
    payouts: results,
  });
}
