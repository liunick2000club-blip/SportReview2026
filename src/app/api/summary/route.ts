import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfYear, differenceInDays, format, addDays } from "date-fns";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const todayEnd = addDays(new Date(), 2); // 截止到后天，确保包含所有时区偏差的今日记录
    const todayEndStr = todayEnd.toISOString();
    const yearStart = startOfYear(new Date("2026-01-01"));
    
    // 0. 抓取当前用户 2026 年的所有数据（在内存中过滤以绕过 Prisma/SQLite 日期比较 Bug）
    const allActivities = await prisma.activity.findMany({
      where: {
        userId: userId,
        date: {
          gte: new Date('2026-01-01'),
        }
      }
    });

    // 过滤出截止到今天（含时区宽限）的数据
    const activities = allActivities.filter(a => {
      const actDateStr = typeof a.date === 'string' ? a.date : a.date.toISOString();
      return actDateStr <= todayEndStr;
    });

    // 1. 计算年卡摊销费用
    const daysPassed = differenceInDays(todayEnd, yearStart) + 1; 
    const annualCardDailyCost = 3288 / 365;
    const amortizedCost = daysPassed * annualCardDailyCost;

    // 2. 汇总单次活动费用
    const totalExtraCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);

    // 3. 统计攀岩馆次数
    const climbingActivities = activities.filter(a => a.type === 'Climbing');
    const climbingGymMap: Record<string, { count: number, totalCost: number }> = {};
    climbingActivities.forEach(a => {
      const name = a.gymName || "未知";
      if (!climbingGymMap[name]) climbingGymMap[name] = { count: 0, totalCost: 0 };
      climbingGymMap[name].count++;
      climbingGymMap[name].totalCost += (a.cost || 0);
    });
    const climbingStats = Object.entries(climbingGymMap).map(([name, s]) => ({
      name,
      count: s.count,
      totalCost: s.totalCost
    }));

    // 3.1 攀岩月度趋势
    const climbingMonthlyMap: Record<string, number> = {};
    climbingActivities.forEach(act => {
      const month = format(new Date(act.date), "MM");
      climbingMonthlyMap[month] = (climbingMonthlyMap[month] || 0) + 1;
    });
    const climbingMonthly = Object.entries(climbingMonthlyMap).map(([month, count]) => ({ month, count }));

    // 4. 统计跑步和骑行距离
    const runningActivities = activities.filter(a => a.type === 'Running');
    const cyclingActivities = activities.filter(a => a.type === 'Cycling');

    const totalRunningDistance = runningActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
    const totalCyclingDistance = cyclingActivities.reduce((sum, a) => sum + (a.distance || 0), 0);

    // 4.1 跑步月度趋势
    const runningMonthlyMap: Record<string, number> = {};
    runningActivities.forEach(act => {
      const month = format(new Date(act.date), "MM");
      runningMonthlyMap[month] = (runningMonthlyMap[month] || 0) + (act.distance || 0);
    });
    const runningMonthly = Object.entries(runningMonthlyMap).map(([month, totalDistance]) => ({ month, totalDistance }));

    // 4.2 骑行月度趋势
    const cyclingMonthlyMap: Record<string, number> = {};
    cyclingActivities.forEach(act => {
      const month = format(new Date(act.date), "MM");
      cyclingMonthlyMap[month] = (cyclingMonthlyMap[month] || 0) + (act.distance || 0);
    });
    const cyclingMonthly = Object.entries(cyclingMonthlyMap).map(([month, totalDistance]) => ({ month, totalDistance }));

    // 5. 汇总数据
    const totalActivitiesCount = activities.length;
    const otherCount = activities.filter(a => a.type === 'Other').length;

    const topClimbingGyms = climbingStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => s.name);

    return NextResponse.json({
      climbing: climbingStats,
      climbingMonthly: climbingMonthly || [],
      distances: {
        running: totalRunningDistance,
        cycling: totalCyclingDistance,
        runningMonthly: runningMonthly || [],
        cyclingMonthly: cyclingMonthly || [],
      },
      summary: {
        totalActivities: totalActivitiesCount,
        otherCount,
        totalSportsCost: amortizedCost + totalExtraCost,
        amortizedCost,
        extraCost: totalExtraCost,
        topGyms: topClimbingGyms
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
