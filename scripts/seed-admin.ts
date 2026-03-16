import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@sportreview.com";
  const adminPassword = "password123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 1. 查找或创建默认管理员用户
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Admin",
        stravaClientId: process.env.STRAVA_CLIENT_ID,
        stravaClientSecret: process.env.STRAVA_CLIENT_SECRET,
        stravaRefreshToken: process.env.STRAVA_REFRESH_TOKEN,
        dingtalkWebhook: process.env.DINGTALK_WEBHOOK_URL,
      }
    });
    console.log(`Created admin user with email: ${adminEmail} with Strava config`);
  } else {
    // 同时也更新一下已有用户的配置，防止之前没写进去
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        stravaClientId: process.env.STRAVA_CLIENT_ID,
        stravaClientSecret: process.env.STRAVA_CLIENT_SECRET,
        stravaRefreshToken: process.env.STRAVA_REFRESH_TOKEN,
        dingtalkWebhook: process.env.DINGTALK_WEBHOOK_URL,
      }
    });
    console.log(`Updated admin user Strava configuration.`);
  }

  // 2. 将所有未分配的 Activity 关联给该管理员
  const unassignedCount = await prisma.activity.count({
    where: { userId: null }
  });

  if (unassignedCount > 0) {
    await prisma.activity.updateMany({
      where: { userId: null },
      data: { userId: admin.id }
    });
    console.log(`Assigned ${unassignedCount} activities to admin.`);
  } else {
    console.log("No unassigned activities found.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
