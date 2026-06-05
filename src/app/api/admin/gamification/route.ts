import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { gamificationConfig } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

const configSchema = z.object({
  key: z.string().min(2),
  label: z.string().min(2),
  value: z.coerce.number().min(0),
  description: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa mengatur gamifikasi" }, { status: 403 });
  }

  const parsed = configSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Input gamifikasi tidak valid" }, { status: 400 });
  }

  const existing = await db
    .select({ id: gamificationConfig.id })
    .from(gamificationConfig)
    .where(eq(gamificationConfig.key, parsed.data.key))
    .limit(1);

  const values = {
    key: parsed.data.key,
    label: parsed.data.label,
    value: parsed.data.value.toFixed(2),
    description: parsed.data.description || null,
    isActive: parsed.data.is_active ?? true
  };

  const [row] = existing.length
    ? await db
        .update(gamificationConfig)
        .set(values)
        .where(eq(gamificationConfig.key, parsed.data.key))
        .returning({ id: gamificationConfig.id })
    : await db.insert(gamificationConfig).values(values).returning({ id: gamificationConfig.id });

  await writeAuditLog(db, {
    actor: session.user,
    action: existing.length ? "UPDATE_GAMIFICATION" : "CREATE_GAMIFICATION",
    module: "GAMIFICATION",
    entityId: row.id,
    detail: { key: parsed.data.key, value: parsed.data.value }
  });

  return NextResponse.json({ id: row.id });
}
