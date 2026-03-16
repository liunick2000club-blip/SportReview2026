import { prisma } from "@/lib/prisma";
import { parseDingTalkMessage } from "@/lib/activity-parser";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, format } from "date-fns";

// File updated to force rebuild - 2026-03-16
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text?.content;

    if (!text) {
      return NextResponse.json({ msgtype: "text", text: { content: "抱歉，我没能读懂你的消息。" } });
    }

    // 1. 调用解析引擎
    const parsed = parseDingTalkMessage(text);
    if (!parsed) {
      return NextResponse.json({ msgtype: "text", text: { content: "无法解析该指令。录入请发：'昨天 环岛 攀岩 50元'；查询请发：'查询昨天记录'。" } });
    }

    const { intent, date } = parsed;
    const dateStr = format(date, "yyyy-MM-dd");

    // 2. 处理查询意图
    if (intent === "query") {
      const activities = await prisma.activity.findMany({
        where: {
          date: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        orderBy: { date: "asc" },
      });

      if (activities.length === 0) {
        return NextResponse.json({
          msgtype: "text",
          text: { content: `🔍 ${dateStr} 尚未查询到运动记录。` }
        });
      }

      let reply = `🔍 ${dateStr} 共有 ${activities.length} 条记录：\n\n`;
      activities.forEach((act, index) => {
        reply += `${index + 1}. 【${act.type}】`;
        if (act.gymName) reply += ` - ${act.gymName}`;
        if (act.distance) reply += ` (${act.distance}km)`;
        if (act.cost) reply += ` [¥${act.cost.toFixed(2)}]`;
        reply += `\n   备注: ${act.notes || "无"}\n`;
      });

      return NextResponse.json({
        msgtype: "text",
        text: { content: reply }
      });
    }

    // 3. 处理录入意图
    const { type, gymName, cost, distance, notes } = parsed;
    let finalCost = cost || null;

    // 针对不同场馆的自动计费规则
    if (type === "Climbing" && gymName) {
      const lowerGym = gymName.toLowerCase();
      if (lowerGym.includes("cliffs")) finalCost = 68 + (finalCost || 0);
      else if (lowerGym.includes("环岛")) finalCost = 70 + (finalCost || 0);
    }

    const activity = await prisma.activity.create({
      data: {
        date: date,
        type: type || "Other",
        gymName: gymName || null,
        cost: finalCost,
        distance: distance || null,
        notes: notes || null,
      },
    });

    // 4. 回复录入结果
    const reply = `✅ 记录成功！\n日期：${date.toLocaleDateString()}\n类型：${type || "Other"}\n场馆：${gymName || "无"}\n费用：${finalCost ? "¥" + finalCost.toFixed(2) : "无"}\n里程：${distance ? distance + "km" : "无"}`;
    
    return NextResponse.json({
      msgtype: "text",
      text: { content: reply }
    });

  } catch (error) {
    console.error("DingTalk Receive Error:", error);
    return NextResponse.json({ msgtype: "text", text: { content: "记录失败，服务器处理异常。" } });
  }
}
