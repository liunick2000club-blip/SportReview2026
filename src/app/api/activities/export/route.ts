import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = (session.user as any).id;

    // 获取该用户的所有运动记录
    const activities = await prisma.activity.findMany({
      where: {
        userId: userId,
      },
      orderBy: { date: "desc" },
    });

    // CSV 表头
    const headers = ["Date", "Type", "GymName", "Cost", "Distance", "Notes"];
    
    // 转换为 CSV 行
    const rows = activities.map(act => {
      const date = new Date(act.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const escape = (val: any) => {
        if (val === null || val === undefined) return "";
        let str = String(val);
        if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
          str = "\"" + str.replace(/"/g, "\"\"") + "\"";
        }
        return str;
      };

      return [
        dateStr,
        escape(act.type),
        escape(act.gymName),
        act.cost || "",
        act.distance || "",
        escape(act.notes)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // 返回 CSV 文件响应，添加 BOM 以支持 Excel 打开中文
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentWithBom = Buffer.concat([bom, Buffer.from(csvContent)]);

    return new NextResponse(contentWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sport_activities_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export Error:", error);
    return new Response("Failed to export activities", { status: 500 });
  }
}
