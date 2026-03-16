import { NextResponse } from "next/server";
import { fetchRecentStravaActivities, syncStravaActivity } from "@/lib/strava";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 递归地将 BigInt 转换为字符串，以解决 JSON 序列化问题
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return data.toString();
  if (Array.isArray(data)) return data.map(serializeBigInt);
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return data;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const stravaActivities = await fetchRecentStravaActivities(userId);
    
    let addedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const act of stravaActivities) {
      const result = await syncStravaActivity(act, userId);
      if (result.skipped) {
        skippedCount++;
      } else {
        addedCount++;
      }
    }

    const response = {
      success: true,
      message: `Sync completed: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped.`,
      addedCount,
      updatedCount,
      skippedCount
    };

    return NextResponse.json(serializeBigInt(response));
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Unknown error during sync. Please check your Strava settings." 
    }, { status: 500 });
  }
}
