import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { getUserPlan, getAnalyticsDaysLimit } from "@/lib/planLimits";
import type { TimeRange } from "@/types";

const RANGE_DAYS: Record<TimeRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = (req.nextUrl.searchParams.get("range") ?? "7d") as TimeRange;
  if (!["24h", "7d", "30d"].includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const plan = await getUserPlan(session.user.id);
  const maxDays = getAnalyticsDaysLimit(plan);
  const requestedDays = RANGE_DAYS[range];

  if (requestedDays > maxDays) {
    return NextResponse.json(
      { error: "Analytics range not available on your plan" },
      { status: 403 }
    );
  }

  const data = await getAnalytics(session.user.id, range);

  return NextResponse.json(data);
}
