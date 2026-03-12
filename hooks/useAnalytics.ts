"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData, TimeRange } from "@/types";

export function useAnalytics(range: TimeRange) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
}
