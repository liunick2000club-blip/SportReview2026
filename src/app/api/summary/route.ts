import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { endOfDay, startOfYear, differenceInDays, format } from "date-fns";

export async function GET() {
  try {
    const todayEnd = endOfDay(new Date());
    const yearStart = startOfYear(new Date("2026-01-01"));
    
    // 1. 计算年卡摊销费用
    // 年费 3288, 每天摊销 3288 / 365
    const daysPassed = differenceInDays(todayEnd, yearStart) + 1; // 包含今天
    const annualCardDailyCost = 3288 / 365;
    const amortizedCost = daysPassed * annualCardDailyCost;

    // 2. 汇总单次活动费用 (如 Cliffs, 报名费等)
    const extraCostsResult = await prisma.activity.aggregate({
      where: { 
        cost: { gt: 0 },
        date: { lte: todayEnd }
      },
      _sum: { cost: true }
    });
    const totalExtraCost = extraCostsResult._sum.cost || 0;

    // 3. 统计攀岩馆次数
    const climbingStats = await prisma.activity.groupBy({
      by: ['gymName'],
      where: { 
        type: 'Climbing',
        date: { lte: todayEnd }
      },
      _count: { id: true },
      _sum: { cost: true },
    });

    // 3.1 攀岩月度趋势 (使用 Prisma groupBy)
    const climbingMonthlyRaw = await prisma.activity.findMany({
      where: { 
        type: 'Climbing',
        date: {
          gte: new Date('2026-01-01'),
          lte: todayEnd
        }
      },
      select: { date: true }
    });

    const climbingMonthlyMap: Record<string, number> = {};
    climbingMonthlyRaw.forEach(act => {
      const month = format(new Date(act.date), "MM");
      climbingMonthlyMap[month] = (climbingMonthlyMap[month] || 0) + 1;
    });
    const climbingMonthly = Object.entries(climbingMonthlyMap).map(([month, count]) => ({ month, count }));

    // 4. 统计跑步和骑行距离
    const runningDistance = await prisma.activity.aggregate({
      where: { 
        type: 'Running',
        date: { lte: todayEnd }
      },
      _sum: { distance: true },
    });

    // 4.1 跑步月度趋势 (使用 findMany + JS 聚合)
    const runningMonthlyRaw = await prisma.activity.findMany({
      where: {
        type: 'Running',
        date: {
          gte: new Date('2026-01-01'),
          lte: todayEnd
        }
      },
      select: { date: true, distance: true }
    });

    const runningMonthlyMap: Record<string, number> = {};
    runningMonthlyRaw.forEach(act => {
      const month = format(new Date(act.date), "MM");
      runningMonthlyMap[month] = (runningMonthlyMap[month] || 0) + (act.distance || 0);
    });
    const runningMonthly = Object.entries(runningMonthlyMap).map(([month, totalDistance]) => ({ month, totalDistance }));

    // 4.2 骑行月度趋势 (使用 findMany + JS 聚合)
    const cyclingMonthlyRaw = await prisma.activity.findMany({
      where: {
        type: 'Cycling',
        date: {
          gte: new Date('2026-01-01'),
          lte: todayEnd
        }
      },
      select: { date: true, distance: true }
    });

    const cyclingMonthlyMap: Record<string, number> = {};
    cyclingMonthlyRaw.forEach(act => {
      const month = format(new Date(act.date), "MM");
      cyclingMonthlyMap[month] = (cyclingMonthlyMap[month] || 0) + (act.distance || 0);
    });
    const cyclingMonthly = Object.entries(cyclingMonthlyMap).map(([month, totalDistance]) => ({ month, totalDistance }));

    const cyclingDistance = await prisma.activity.aggregate({
      where: { 
        type: 'Cycling',
        date: { lte: todayEnd }
      },
      _sum: { distance: true },
    });

    // 5. 汇总数据
    const totalActivities = await prisma.activity.count({
      where: { date: { lte: todayEnd } }
    });

    const topClimbingGyms = await prisma.activity.groupBy({
      by: ['gymName'],
      where: { 
        type: 'Climbing', 
        date: { lte: todayEnd },
        NOT: { gymName: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3
    });

    const otherCount = await prisma.activity.count({
      where: { 
        type: 'Other',
        date: { lte: todayEnd }
      },
    });

    return NextResponse.json({
      climbing: climbingStats.map(s => ({
        name: s.gymName || "未知",
        count: s._count.id,
        totalCost: s._sum.cost || 0
      })),
      climbingMonthly: climbingMonthly || [], // 攀岩月度趋势数据
      distances: {
        running: runningDistance._sum.distance || 0,
        cycling: cyclingDistance._sum.distance || 0,
        runningMonthly: runningMonthly || [], // 跑步月度趋势数据
        cyclingMonthly: cyclingMonthly || [], // 骑行月度趋势数据
      },
      summary: {
        totalActivities,
        otherCount,
        totalSportsCost: amortizedCost + totalExtraCost, // 总运动花费
        amortizedCost, // 摊销金额
        extraCost: totalExtraCost, // 额外支出
        topGyms: topClimbingGyms.map(g => g.gymName)
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
