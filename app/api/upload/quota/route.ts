import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUploadQuota } from "@/lib/planLimits";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await getUploadQuota(user.id);
  return NextResponse.json(quota);
}
