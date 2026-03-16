import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { id } = await params;
    const activityId = parseInt(id);
    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (activity.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { id } = await params;
    const activityId = parseInt(id);

    const existing = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { date, type, gymName, cost, distance, notes } = body;

    // 确保日期被解析为当天的 00:00:00，避免时区偏移
    const parsedDate = new Date(date + "T00:00:00Z");

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        date: parsedDate,
        type,
        gymName: gymName || null,
        cost: cost ? parseFloat(cost) : null,
        distance: distance ? parseFloat(distance) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(updatedActivity);
  } catch (error: any) {
    console.error("Update Error Detailed:", error);
    return NextResponse.json({ error: error.message || "Failed to update activity" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { id } = await params;
    const activityId = parseInt(id);

    const existing = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.activity.delete({ where: { id: activityId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
