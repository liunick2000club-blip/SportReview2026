import { prisma } from "@/lib/prisma";
import { sendDingTalkMessage } from "@/lib/dingtalk";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, subDays, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const mode = searchParams.get("mode");

    const todayEnd = addDays(new Date(), 2);
    const todayEndStr = todayEnd.toISOString();

    // 抓取 2026 年的所有数据（内存过滤）
    const allActivities = await prisma.activity.findMany({
      where: {
        date: {
          gte: new Date('2026-01-01'),
        }
      },
      orderBy: { date: "desc" },
    });

    let filtered = allActivities.filter(a => {
      const actDateStr = typeof a.date === 'string' ? a.date : a.date.toISOString();
      return actDateStr <= todayEndStr;
    });

    if (mode === "week") {
      const weekAgo = subDays(new Date(), 7).toISOString();
      filtered = filtered.filter(a => {
        const actDateStr = typeof a.date === 'string' ? a.date : a.date.toISOString();
        return actDateStr >= weekAgo;
      });
    }

    return NextResponse.json(filtered.slice(0, limit));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, gymName, cost, distance, notes } = body;

    const parsedDate = new Date(date + "T00:00:00Z");

    let finalCost = cost ? parseFloat(cost) : null;

    if (type === "Climbing" && gymName) {
      const lowerGym = gymName.toLowerCase();
      if (lowerGym.includes("cliffs")) {
        finalCost = 68 + (finalCost || 0);
      } else if (lowerGym.includes("环岛")) {
        finalCost = 70 + (finalCost || 0);
      }
    }

    const activity = await prisma.activity.create({
      data: {
        date: parsedDate,
        type,
        gymName: gymName || null,
        cost: finalCost,
        distance: distance ? parseFloat(distance) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
