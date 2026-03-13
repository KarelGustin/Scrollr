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
 */
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      stripeConnectId: true,
      stripeConnectOnboarded: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    let connectId = dbUser.stripeConnectId;

    if (connectId) {
      // Check if already onboarded
      const onboarded = await isAccountOnboarded(connectId);
      if (onboarded) {
        // Update DB if needed
        if (!dbUser.stripeConnectOnboarded) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectOnboarded: true },
          });
        }
        return NextResponse.json({
          connected: true,
          onboarded: true,
          message: "Account already onboarded",
        });
      }

      // Not yet onboarded, create a new onboarding link
      const url = await createOnboardingLink(
        connectId,
        `${APP_URL}/earnings?stripe=success`,
        `${APP_URL}/earnings?stripe=refresh`
      );

      return NextResponse.json({ url });
    }

    // No Connect account yet — create one
    connectId = await createConnectAccount(dbUser.email, "creator");

    // Save to user record
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectId: connectId },
    });

    // Create onboarding link
    const url = await createOnboardingLink(
      connectId,
      `${APP_URL}/earnings?stripe=success`,
      `${APP_URL}/earnings?stripe=refresh`
    );

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
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      stripeConnectId: true,
      stripeConnectOnboarded: true,
    },
  });

  if (!dbUser?.stripeConnectId) {
    return NextResponse.json({
      connected: false,
      onboarded: false,
    });
  }

  try {
    const onboarded = await isAccountOnboarded(dbUser.stripeConnectId);

    // Update DB if status changed
    if (onboarded && !dbUser.stripeConnectOnboarded) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectOnboarded: true },
      });
    }

    let dashboardUrl: string | undefined;
    if (onboarded) {
      dashboardUrl = await createDashboardLink(dbUser.stripeConnectId);
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
      onboarded: dbUser.stripeConnectOnboarded,
    });
  }
}
