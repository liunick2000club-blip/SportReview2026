import { prisma } from "./prisma";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

/**
 * 使用 Refresh Token 获取最新的 Access Token
 */
async function getAccessToken() {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    throw new Error("Missing Strava configuration in environment variables");
  }
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Strava Token Refresh Error:", errorBody);
    throw new Error("Failed to refresh Strava access token");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 抓取 2026 年以来所有的 Strava 活动
 */
export async function fetchRecentStravaActivities() {
  const accessToken = await getAccessToken();
  
  const afterTimestamp = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
  
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=200`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Strava Fetch Error:", errorBody);
    throw new Error("Failed to fetch Strava activities");
  }

  return await response.json();
}

/**
 * 格式化持续时间
 */
function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}时${mins}分${secs.toString().padStart(2, '0')}秒`;
  }
  return `${mins}分${secs.toString().padStart(2, '0')}秒`;
}

/**
 * 将 Strava 活动映射并存入本地数据库
 */
export async function syncStravaActivity(stravaActivity: any) {
  const {
    id: stravaId,
    start_date_local,
    type,
    sport_type,
    distance,
    moving_time,
    name,
    average_heartrate,
    total_elevation_gain,
  } = stravaActivity;

  let localType = "Other";
  const st = (sport_type || type).toLowerCase();

  if (["run", "hike", "walk"].includes(st)) {
    localType = "Running";
  } else if (["ride", "virtualride"].includes(st)) {
    localType = "Cycling";
  }

  const detailNotes = [
    `[Strava] ${name}`,
    `类型: ${type}`,
    `耗时: ${formatDuration(moving_time)}`,
    average_heartrate ? `心率: ${Math.round(average_heartrate)}bpm` : null,
    total_elevation_gain ? `爬升: ${Math.round(total_elevation_gain)}m` : null,
  ].filter(Boolean).join(" | ");

  const date = new Date(start_date_local);

  // 查重：两分钟内相同类型的活动即视为重复
  const existing = await prisma.activity.findFirst({
    where: {
      date: {
        gte: new Date(date.getTime() - 1000 * 60 * 2),
        lte: new Date(date.getTime() + 1000 * 60 * 2),
      },
      type: localType,
    }
  });

  if (existing) {
    return { skipped: true, reason: "Already exists", id: existing.id };
  }

  // 写入数据库
  const newActivity = await prisma.activity.create({
    data: {
      date,
      type: localType,
      distance: parseFloat((distance / 1000).toFixed(2)), // 转为 KM
      notes: detailNotes,
      gymName: "Strava Sync",
    }
  });

  return { skipped: false, id: newActivity.id };
}
