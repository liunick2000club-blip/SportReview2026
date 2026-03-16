import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import csvParser from "csv-parser";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const results: any[] = [];
    
    // Create a readable stream from the text content
    const stream = Readable.from(text);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    let successCount = 0;

    for (const row of results) {
      const dateStr = row.Date;
      const type = row.Type;

      if (!dateStr || !type) continue;

      const date = new Date(dateStr + "T00:00:00Z");
      const gymName = row.GymName || null;
      const cost = row.Cost ? parseFloat(row.Cost) : null;
      const distance = row.Distance ? parseFloat(row.Distance) : null;
      const notes = row.Notes || null;

      await prisma.activity.create({
        data: {
          userId,
          date,
          type,
          gymName,
          cost,
          distance,
          notes,
        }
      });
      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });

  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
