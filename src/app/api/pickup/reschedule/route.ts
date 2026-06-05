import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests, pickupRescheduleLog } from "@/db/schema";
import { canCafeReschedule, createScheduleDate } from "@/lib/pickup";

const rescheduleSchema = z.object({
  pickup_id: z.string().uuid(),
  schedule_date: z.string().min(1, "Tanggal wajib dipilih"),
  slot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  reason: z.string().min(3, "Alasan minimal 3 karakter")
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "CAFE") {
    return NextResponse.json({ message: "Hanya Kafe yang bisa reschedule pickup" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = rescheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const [pickup] = await db
    .select()
    .from(pickupRequests)
    .where(and(eq(pickupRequests.id, parsed.data.pickup_id), eq(pickupRequests.cafeId, session.user.id)))
    .limit(1);

  if (!pickup) {
    return NextResponse.json({ message: "Pickup tidak ditemukan" }, { status: 404 });
  }

  if (!canCafeReschedule(pickup.status)) {
    return NextResponse.json(
      { message: "Pickup hanya bisa dijadwalkan ulang saat PENDING atau ASSIGNED" },
      { status: 409 }
    );
  }

  const [logCount] = await db
    .select({ value: count() })
    .from(pickupRescheduleLog)
    .where(eq(pickupRescheduleLog.pickupId, pickup.id));

  if ((logCount?.value ?? 0) >= 1) {
    return NextResponse.json({ message: "Reschedule maksimal 1x per request" }, { status: 409 });
  }

  const newDate = createScheduleDate(parsed.data.schedule_date, parsed.data.slot);

  await db.transaction(async (tx) => {
    await tx.insert(pickupRescheduleLog).values({
      pickupId: pickup.id,
      oldDate: pickup.scheduleDate,
      newDate,
      reason: parsed.data.reason
    });

    await tx
      .update(pickupRequests)
      .set({
        scheduleDate: newDate,
        rescheduleReason: parsed.data.reason,
        status: "RESCHEDULED"
      })
      .where(eq(pickupRequests.id, pickup.id));
  });

  return NextResponse.json({
    id: pickup.id,
    status: "RESCHEDULED",
    schedule_date: newDate.toISOString()
  });
}
