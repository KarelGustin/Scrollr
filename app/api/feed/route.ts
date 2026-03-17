import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getRankedFeedPage } from "@/lib/feed-ranking";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const viewerSessionId = req.cookies.get("cart_session")?.value;
  const category = searchParams.get("category");
  const user = await getUser();
  const feed = await getRankedFeedPage({
    viewerSessionId,
    viewerUserId: user?.id ?? null,
    limit,
    cursor,
    category,
  });

  return NextResponse.json(feed);
}
