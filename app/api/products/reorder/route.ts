import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orderedIds } = body as { orderedIds: string[] };

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: "orderedIds must be a non-empty array" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.product.update({
        where: { id, userId: user.id },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
