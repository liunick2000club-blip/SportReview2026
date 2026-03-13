import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: "file:./dev.db"
});

async function patchDistances() {
  console.log("正在修复跑步和骑行的距离数据...");
  
  const activities = await prisma.activity.findMany({
    where: {
      type: { in: ["Running", "Cycling"] },
      distance: null,
    }
  });

  console.log(`找到 ${activities.length} 条待修复记录。`);

  let patchedCount = 0;
  for (const act of activities) {
    if (!act.notes) continue;

    // 尝试从备注中提取纯数字（支持小数）
    // 匹配如 "5.2", "10", "12.5km" 等
    const match = act.notes.match(/(\d+(\.\d+)?)/);
    if (match) {
      const dist = parseFloat(match[1]);
      await prisma.activity.update({
        where: { id: act.id },
        data: { distance: dist }
      });
      patchedCount++;
    }
  }

  console.log(`修复完成！成功更新了 ${patchedCount} 条记录。`);
  await prisma.$disconnect();
}

patchDistances().catch(console.error);
