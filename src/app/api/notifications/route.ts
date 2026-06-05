import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(or(eq(notifications.userId, session.user.id), eq(notifications.role, session.user.role)))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return NextResponse.json({
    notifications: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString()
    })),
    unread: rows.filter((row) => !row.isRead).length
  });
}

export async function PATCH() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.isRead, false),
        or(eq(notifications.userId, session.user.id), eq(notifications.role, session.user.role))
      )
    );

  return NextResponse.json({ ok: true });
}
