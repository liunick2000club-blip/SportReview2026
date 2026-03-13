import { prisma } from "@/lib/prisma";
import { parseDingTalkMessage } from "@/lib/activity-parser";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ msgtype: "text", text: { content: "无法解析该运动记录，请提供类似：'昨天 滨江 攀岩 50元' 的消息。" } });
    }

    // 2. 数据库写入 (复用之前的计费逻辑)
    const { date, type, gymName, cost, distance, notes } = parsed;
    let finalCost = cost || null;
    const AMORTIZED_DAILY_COST = 3288 / 365;

    // 针对不同场馆的自动计费规则
    if (type === "Climbing" && gymName) {
      const lowerGym = gymName.toLowerCase();
      if (lowerGym.includes("cliffs")) finalCost = 68 + (finalCost || 0);
      else if (lowerGym.includes("环岛")) finalCost = 70 + (finalCost || 0);
      // 顽攀/滨江作为年卡场馆，在后台摊销，此处仅记额外费用
    }

    const activity = await prisma.activity.create({
      data: {
        date: date,
        type,
        gymName: gymName || null,
        cost: finalCost,
        distance: distance || null,
        notes: notes || null,
      },
    });

    // 3. 回复结果
    const reply = `✅ 记录成功！\n日期：${date.toLocaleDateString()}\n类型：${type}\n场馆：${gymName || "无"}\n费用：${finalCost ? "¥" + finalCost.toFixed(2) : "无"}\n里程：${distance ? distance + "km" : "无"}`;
    
    return NextResponse.json({
      msgtype: "text",
      text: { content: reply }
    });

  } catch (error) {
    console.error("DingTalk Receive Error:", error);
    return NextResponse.json({ msgtype: "text", text: { content: "记录失败，请检查数据库连接。" } });
  }
}
