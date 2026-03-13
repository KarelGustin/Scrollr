import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCreatorApplicationResult } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { action, adminNote } = body as {
    action: "approve" | "reject";
    adminNote?: string;
  };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const application = await prisma.creatorApplication.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Application already reviewed" }, { status: 400 });
  }

  const now = new Date();

  if (action === "approve") {
    await prisma.$transaction([
      prisma.creatorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: user.id,
          reviewedAt: now,
          adminNote: adminNote || null,
        },
      }),
      prisma.user.update({
        where: { id: application.userId },
        data: { role: "CREATOR" },
      }),
    ]);

    sendCreatorApplicationResult(application.user.email, {
      name: application.user.name || "Creator",
      status: "approved",
    });
  } else {
    await prisma.creatorApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: user.id,
        reviewedAt: now,
        adminNote: adminNote || null,
      },
    });

    sendCreatorApplicationResult(application.user.email, {
      name: application.user.name || "Creator",
      status: "rejected",
      adminNote: adminNote || undefined,
    });
  }

  return NextResponse.json({ success: true, action });
}
