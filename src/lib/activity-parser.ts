import { subDays, startOfDay, endOfDay, setDay, subWeeks } from "date-fns";

export interface ParsedCommand {
  intent: "record" | "query";
  date: Date;
  type?: string;
  gymName?: string;
  cost?: number;
  distance?: number;
  notes?: string;
}

export function parseDingTalkMessage(text: string): ParsedCommand | null {
  const content = text.trim();
  
  // 1. 识别意图
  const isQuery = content.includes("查询") || 
                  content.includes("做了什么") || 
                  content.includes("记录") && (content.includes("有哪些") || content.includes("是什么")) ||
                  (content.startsWith("上周") || content.startsWith("上个月") || content.includes("周")) && !content.includes("元") && !content.includes("km");
  
  const intent = isQuery ? "query" : "record";

  // 2. 增强型日期解析
  let date = new Date();
  const dayMap: Record<string, number> = { "天": 0, "日": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };

  if (content.includes("昨天")) {
    date = subDays(new Date(), 1);
  } else if (content.includes("前天")) {
    date = subDays(new Date(), 2);
  } else if (content.includes("上周")) {
    const dayStr = content.split("上周")[1]?.charAt(0);
    if (dayMap[dayStr] !== undefined) {
      date = subWeeks(setDay(new Date(), dayMap[dayStr]), 1);
    }
  } else if (content.includes("周") || content.includes("星期")) {
    const parts = content.split(/周|星期/);
    const dayStr = parts[1]?.charAt(0);
    if (dayMap[dayStr] !== undefined) {
      date = setDay(new Date(), dayMap[dayStr]);
    }
  } else if (content.match(/(\d+)月(\d+)日/)) {
    const match = content.match(/(\d+)月(\d+)日/);
    if (match) {
      date = new Date(new Date().getFullYear(), parseInt(match[1]) - 1, parseInt(match[2]));
    }
  }

  if (intent === "query") {
    return { intent, date };
  }

  // 3. 识别运动类型
  let type = "Other";
  if (content.includes("攀岩") || content.includes("爬墙")) type = "Climbing";
  else if (content.includes("跑步") || content.includes("慢跑")) type = "Running";
  else if (content.includes("骑行") || content.includes("单车")) type = "Cycling";

  // 4. 提取金额
  const costMatch = content.match(/(\d+(\.\d+)?)\s*元/);
  const cost = costMatch ? parseFloat(costMatch[1]) : undefined;

  // 5. 提取距离
  const distMatch = content.match(/(\d+(\.\d+)?)\s*(km|公里)/i);
  const distance = distMatch ? parseFloat(distMatch[1]) : undefined;

  // 6. 提取场馆
  let gymName = undefined;
  const gyms = ["滨江", "文体", "岩时", "Cliffs", "环岛", "顽攀", "宏泰", "RockPlus"];
  gymName = gyms.find(g => content.includes(g));

  return { intent, date, type, gymName, cost, distance, notes: content };
}
