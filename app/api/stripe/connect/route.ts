import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createConnectAccount,
  createOnboardingLink,
  isAccountOnboarded,
  createDashboardLink,
} from "@/lib/stripe-connect";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST: Create or retrieve Stripe Connect account and return onboarding URL.
 * Supports both creators (User model) and merchants (Merchant model).
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      role: true,
      stripeConnectId: true,
      stripeConnectOnboarded: true,
      merchant: { select: { id: true, stripeConnectAccountId: true, stripeConnectOnboarded: true } },
    },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isMerchant = dbUser.role === "MERCHANT";

  try {
    let connectId = isMerchant
      ? dbUser.merchant?.stripeConnectAccountId
      : dbUser.stripeConnectId;

    if (connectId) {
      // Check if already onboarded
      const onboarded = await isAccountOnboarded(connectId);
      if (onboarded) {
        // Update DB if needed
        if (isMerchant && dbUser.merchant && !dbUser.merchant.stripeConnectOnboarded) {
          await prisma.merchant.update({
            where: { id: dbUser.merchant.id },
            data: { stripeConnectOnboarded: true },
          });
        } else if (!isMerchant && !dbUser.stripeConnectOnboarded) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectOnboarded: true },
          });
        }
        return NextResponse.json({ connected: true, onboarded: true });
      }

      // Not yet onboarded, create a new onboarding link
      const returnPath = isMerchant ? "/merchant?stripe=complete" : "/earnings?stripe=success";
      const refreshPath = isMerchant ? "/merchant?stripe=refresh" : "/earnings?stripe=refresh";
      const url = await createOnboardingLink(connectId, `${APP_URL}${returnPath}`, `${APP_URL}${refreshPath}`);
      return NextResponse.json({ url });
    }

    // No Connect account yet — create one
    connectId = await createConnectAccount(dbUser.email, isMerchant ? "merchant" : "creator");

    if (isMerchant && dbUser.merchant) {
      await prisma.merchant.update({
        where: { id: dbUser.merchant.id },
        data: { stripeConnectAccountId: connectId },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectId: connectId },
      });
    }

    const returnPath = isMerchant ? "/merchant?stripe=complete" : "/earnings?stripe=success";
    const refreshPath = isMerchant ? "/merchant?stripe=refresh" : "/earnings?stripe=refresh";
    const url = await createOnboardingLink(connectId, `${APP_URL}${returnPath}`, `${APP_URL}${refreshPath}`);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json(
      { error: "Failed to set up Stripe Connect" },
      { status: 500 }
    );
  }
}

/**
 * GET: Return Connect status for the current user.
 * Supports both creators (User model) and merchants (Merchant model).
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      stripeConnectId: true,
      stripeConnectOnboarded: true,
      merchant: { select: { id: true, stripeConnectAccountId: true, stripeConnectOnboarded: true } },
    },
  });

  const isMerchant = dbUser?.role === "MERCHANT";
  const connectId = isMerchant
    ? dbUser?.merchant?.stripeConnectAccountId
    : dbUser?.stripeConnectId;

  if (!connectId) {
    return NextResponse.json({
      connected: false,
      onboarded: false,
    });
  }

  try {
    const onboarded = await isAccountOnboarded(connectId);

    // Update DB if status changed
    if (onboarded) {
      if (isMerchant && dbUser?.merchant && !dbUser.merchant.stripeConnectOnboarded) {
        await prisma.merchant.update({
          where: { id: dbUser.merchant.id },
          data: { stripeConnectOnboarded: true },
        });
      } else if (!isMerchant && dbUser && !dbUser.stripeConnectOnboarded) {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeConnectOnboarded: true },
        });
      }
    }

    let dashboardUrl: string | undefined;
    if (onboarded) {
      dashboardUrl = await createDashboardLink(connectId);
    }

    return NextResponse.json({
      connected: true,
      onboarded,
      dashboardUrl,
    });
  } catch (err) {
    console.error("Stripe Connect status error:", err);
    return NextResponse.json({
      connected: true,
      onboarded: isMerchant
        ? dbUser?.merchant?.stripeConnectOnboarded
        : dbUser?.stripeConnectOnboarded,
    });
  }
}
