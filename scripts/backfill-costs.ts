import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: "file:./dev.db"
});

async function backfill() {
  console.log("正在回填攀岩馆单次费用...");

  // 1. Cliffs: 68元
  const r1 = await prisma.activity.updateMany({
    where: { 
      gymName: { contains: "cliffs" },
      cost: null 
    },
    data: { cost: 68 }
  });
  console.log(`Cliffs 记录更新: ${r1.count} 条`);

  // 2. 环岛: 73元
  const r2 = await prisma.activity.updateMany({
    where: { 
      gymName: { contains: "环岛" },
      cost: null 
    },
    data: { cost: 73 }
  });
  console.log(`环岛 记录更新: ${r2.count} 条`);

  // 3. 岩时: 0元
  const r3 = await prisma.activity.updateMany({
    where: { 
      gymName: { contains: "岩时" },
      cost: null 
    },
    data: { cost: 0 }
  });
  console.log(`岩时 记录更新: ${r3.count} 条`);

  // 4. 处理 1月17日 的记录 (如果有的话)
  // 如果是特定的活动费用，通常在备注中。我们确保它不被覆盖。
  
  await prisma.$disconnect();
}

backfill().catch(console.error);
