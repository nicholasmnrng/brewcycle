import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa melihat audit log" }, { status: 403 });
  }

  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

  return NextResponse.json({
    logs: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
  });
}
