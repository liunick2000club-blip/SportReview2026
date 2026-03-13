import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const mode = searchParams.get("mode"); // 'week' for dashboard past week

    let whereClause: any = {
      date: {
        lte: endOfDay(new Date()), // 仅显示今天及以前
      },
    };

    if (mode === "week") {
      whereClause.date = {
        gte: startOfDay(subDays(new Date(), 7)),
        lte: endOfDay(new Date()),
      };
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, gymName, cost, distance, notes } = body;

    // 确保日期正确解析
    const parsedDate = new Date(date + "T00:00:00Z");

    // --- 价格逻辑实现 ---
    let finalCost = cost ? parseFloat(cost) : null;
    const ANNUAL_CARD_PRICE = 3288;
    const AMORTIZED_DAILY_COST = ANNUAL_CARD_PRICE / 365;

    if (type === "Climbing" && gymName) {
      const lowerGym = gymName.toLowerCase();
      if (lowerGym.includes("cliffs")) {
        finalCost = 68 + (finalCost || 0);
      } else if (lowerGym.includes("环岛")) {
        finalCost = 70 + (finalCost || 0);
      }
      // 顽攀/滨江等年卡场馆，finalCost 保持为输入的 extra 即可，不累加摊销
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
