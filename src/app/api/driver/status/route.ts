import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

const statusSchema = z.object({
  online: z.boolean()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DRIVER") {
    return NextResponse.json({ message: "Hanya Driver yang bisa mengubah status online" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input status tidak valid" }, { status: 400 });
  }

  await db.update(users).set({ driverOnline: parsed.data.online }).where(eq(users.id, session.user.id));

  return NextResponse.json({ online: parsed.data.online });
}
