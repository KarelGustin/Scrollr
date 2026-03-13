import { NextRequest, NextResponse } from "next/server";
import { computeVideoScores } from "@/lib/recommendation";

export async function GET(req: NextRequest) {
  // Optional: verify cron secret for security
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await computeVideoScores();

  return NextResponse.json({ ok: true, computedAt: new Date().toISOString() });
}
