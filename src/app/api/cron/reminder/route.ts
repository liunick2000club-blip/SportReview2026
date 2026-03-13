import { prisma } from "@/lib/prisma";
import { sendDingTalkMessage } from "@/lib/dingtalk";
import { NextResponse } from "next/server";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    
    // 逻辑判定：20点以后视为“深夜提醒(当日)”，12点以前视为“次日补录(昨日)”
    const isNightSession = hour >= 20; 
    const targetDate = isNightSession ? now : subDays(now, 1);
    const dateTitle = format(targetDate, "yyyy-MM-dd");

    // 1. 查询目标日期的运动记录
    const activities = await prisma.activity.findMany({
      where: {
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
    });

    let messageContent = "";

    if (activities.length > 0) {
      // 如果是早上且已有记录，则保持安静（不重复打扰）
      if (!isNightSession) {
        return NextResponse.json({ success: true, message: "Yesterday record already exists, no reminder needed." });
      }

      // 如果是晚上且已有记录，发送今日总结
      messageContent = `[LiuNick] 🌙 今日 (${dateTitle}) 运动回顾：\n\n`;
      activities.forEach((act, index) => {
        let line = `${index + 1}. 【${act.type}】`;
        if (act.gymName) line += ` - ${act.gymName}`;
        if (act.distance) line += ` (${act.distance}km)`;
        if (act.cost) line += ` [¥${act.cost}]`;
        line += `\n   备注: ${act.notes || "无"}\n`;
        messageContent += line;
      });
      messageContent += "\n今天也很棒，晚安！😴";
    } else {
      // 无论早晚，只要没填都发链接
      const newUrl = `${baseUrl}/new?date=${dateTitle}`;
      const timeContext = isNightSession ? "今日" : "昨日";
      messageContent = `[LiuNick] 🔔 提醒：${timeContext} (${dateTitle}) 尚未记录活动。\n\n别让汗水被遗忘，趁现在记一笔吧！🏃‍♂️\n\n立即填写：${newUrl}`;
    }

    // 2. 发送钉钉通知
    await sendDingTalkMessage(messageContent);

    return NextResponse.json({ 
      success: true, 
      session: isNightSession ? "Night" : "Morning",
      date: dateTitle, 
      sent: true 
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Failed to process reminder" }, { status: 500 });
  }
}
