import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stravaClientId: true,
        stravaClientSecret: true,
        stravaRefreshToken: true,
        dingtalkWebhook: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { stravaClientId, stravaClientSecret, stravaRefreshToken, dingtalkWebhook } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        stravaClientId: stravaClientId || null,
        stravaClientSecret: stravaClientSecret || null,
        stravaRefreshToken: stravaRefreshToken || null,
        dingtalkWebhook: dingtalkWebhook || null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
