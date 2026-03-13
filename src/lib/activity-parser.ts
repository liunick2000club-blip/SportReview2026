import { subDays, format } from "date-fns";

export interface ParsedActivity {
  date: Date;
  type: string;
  gymName?: string;
  cost?: number;
  distance?: number;
  notes?: string;
}

export function parseDingTalkMessage(text: string): ParsedActivity | null {
  const content = text.trim();
  
  // 1. 确定日期
  let date = new Date();
  if (content.includes("昨天")) {
    date = subDays(new Date(), 1);
  } else if (content.includes("前天")) {
    date = subDays(new Date(), 2);
  }

  // 2. 识别运动类型
  let type = "Other";
  if (content.includes("攀岩") || content.includes("爬墙")) type = "Climbing";
  else if (content.includes("跑步") || content.includes("慢跑")) type = "Running";
  else if (content.includes("骑行") || content.includes("单车")) type = "Cycling";

  // 3. 提取金额 (匹配数字 + 元)
  const costMatch = content.match(/(\d+(\.\d+)?)\s*元/);
  const cost = costMatch ? parseFloat(costMatch[1]) : undefined;

  // 4. 提取距离 (匹配数字 + km/公里)
  const distMatch = content.match(/(\d+(\.\d+)?)\s*(km|公里)/i);
  const distance = distMatch ? parseFloat(distMatch[1]) : undefined;

  // 5. 提取场馆 (针对攀岩)
  let gymName = undefined;
  if (type === "Climbing") {
    const gyms = ["滨江", "文体", "岩时", "Cliffs", "环岛", "顽攀"];
    gymName = gyms.find(g => content.includes(g));
  }

  // 6. 提取备注 (去掉关键词后的剩余部分)
  const notes = content;

  return { date, type, gymName, cost, distance, notes };
}
