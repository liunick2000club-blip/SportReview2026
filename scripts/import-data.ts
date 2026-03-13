import fs from "fs";
import path from "path";
import csv from "csv-parser";
import iconv from "iconv-lite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const csvFilePath = path.resolve("C:/Users/LiuNick/Desktop/SportReview/SportReview2026.csv");

// 攀岩馆关键词列表
const CLIMBING_GYMS = ["探馆", "滨江", "文体", "cliffs", "岩时", "rockplus", "dome", "绿壁虎", "环岛", "顽攀"];

async function importData() {
  const results: any[] = [];
  
  console.log("正在读取 CSV 并解决乱码 (GBK)...");

  // 1. 读取并解码 CSV
  const stream = fs.createReadStream(csvFilePath)
    .pipe(iconv.decodeStream("gbk"))
    .pipe(csv({ headers: false }));

  let rowCount = 0;
  for await (const row of stream) {
    rowCount++;
    if (rowCount <= 4) continue; // 跳过前 4 行表头

    const dateStr = row['0'];
    const itemStr = row['1'] || "";
    const noteStr = row['2'] || "";

    if (!dateStr || !dateStr.includes("/")) continue;

    // 解析日期
    const date = new Date(dateStr);
    
    // 初始化字段
    let type = "Other";
    let gymName = null;
    let cost = null;
    let distance = null;

    const lowerItem = itemStr.toLowerCase();
    const lowerNote = noteStr.toLowerCase();

    // --- 1. 识别运动类型 ---
    if (CLIMBING_GYMS.some(gym => lowerItem.includes(gym.toLowerCase()))) {
      type = "Climbing";
      gymName = itemStr;
    } else if (lowerItem.includes("跑步") || lowerNote.includes("跑步")) {
      type = "Running";
    } else if (lowerItem.includes("骑行") || lowerNote.includes("骑行")) {
      type = "Cycling";
    }

    // --- 2. 价格逻辑 ---
    const ANNUAL_CARD_PRICE = 3288;
    const AMORTIZED_DAILY_COST = ANNUAL_CARD_PRICE / 365;

    if (type === "Climbing") {
      if (lowerItem.includes("cliffs")) {
        cost = 68;
      } else if (lowerItem.includes("环岛")) {
        cost = 70;
      }

      // 提取备注中的金额 (如果是 Cliffs/Huandao 且备注有金额，则累加；年卡场馆则仅作为该条记录的 cost)
      const extraMatch = noteStr.match(/(\d+(\.\d+)?)\s*元/);
      if (extraMatch) {
        cost = (cost || 0) + parseFloat(extraMatch[1]);
      }
    } else {
      // 跑步/骑行等非攀岩项目，仅提取备注中的金额
      const costMatch = noteStr.match(/(\d+(\.\d+)?)\s*元/);
      if (costMatch) cost = parseFloat(costMatch[1]);
    }

    // --- 3. 正则提取距离 (km/公里) ---
    const distMatch = noteStr.match(/(\d+(\.\d+)?)\s*(km|公里)/);
    if (distMatch) distance = parseFloat(distMatch[1]);

    // --- 4. 提取训练感受 (Training Feeling) ---
    // 逻辑：如果是攀岩且备注较长，或者备注中没有金额/距离标记，则视为心得感受
    // 这里我们将完整的 noteStr 存入 notes，并将剔除掉金额/距离后的纯文本作为感受
    let trainingFeeling = noteStr
      .replace(/(\d+(\.\d+)?)\s*元/g, "")
      .replace(/(\d+(\.\d+)?)\s*(km|公里)/g, "")
      .trim();
    
    // 如果剥离后依然包含有效文本，则存入数据库
    const finalNote = trainingFeeling.length > 0 ? trainingFeeling : (noteStr || null);

    results.push({
      date,
      type,
      gymName,
      cost,
      distance,
      notes: finalNote
    });
  }

  console.log(`解析完成，共 ${results.length} 条有效记录。正在写入数据库...`);

  // 2. 存入数据库
  await prisma.activity.deleteMany({}); // 清空旧数据

  for (const item of results) {
    await prisma.activity.create({
      data: item
    });
  }

  console.log("数据迁移成功！");
  console.log("乱码已通过 iconv-lite 解决。");
  console.log("训练心得已通过正则过滤（剥离金额/距离）后独立提取。");
  
  await prisma.$disconnect();
}

importData().catch(e => {
  console.error("执行出错:", e);
  process.exit(1);
});
