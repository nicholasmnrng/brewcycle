import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";

const statusSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.boolean()
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa mengelola akun" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input status akun tidak valid" }, { status: 400 });
  }

  if (parsed.data.user_id === session.user.id && !parsed.data.is_active) {
    return NextResponse.json({ message: "Admin tidak bisa menonaktifkan akun sendiri" }, { status: 409 });
  }

  const [user] = await db
    .update(users)
    .set({ isActive: parsed.data.is_active })
    .where(eq(users.id, parsed.data.user_id))
    .returning({ id: users.id, name: users.name, role: users.role, isActive: users.isActive });

  if (!user) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  await writeAuditLog(db, {
    actor: session.user,
    action: parsed.data.is_active ? "ACTIVATE_ACCOUNT" : "DEACTIVATE_ACCOUNT",
    module: "MASTER_DATA",
    entityId: user.id,
    detail: { target: user.name, role: user.role }
  });

  await createNotification(db, {
    role: "ADMIN",
    type: "INFO",
    title: parsed.data.is_active ? "Akun diaktifkan" : "Akun dinonaktifkan",
    message: `${user.name} (${user.role}) diperbarui.`,
    module: "MASTER_DATA",
    entityId: user.id
  });

  return NextResponse.json({ id: user.id, is_active: user.isActive });
}
