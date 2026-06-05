import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests, users } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";

const assignSchema = z.object({
  pickup_id: z.string().uuid(),
  driver_id: z.string().uuid()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa assign driver" }, { status: 403 });
  }

  const parsed = assignSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input tidak valid" }, { status: 400 });
  }

  const [driver] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, parsed.data.driver_id))
    .limit(1);

  if (!driver) {
    return NextResponse.json({ message: "Driver tidak ditemukan" }, { status: 404 });
  }

  const [updatedPickup] = await db.transaction(async (tx) => {
    const [pickup] = await tx
      .update(pickupRequests)
      .set({
        driverId: parsed.data.driver_id,
        status: "ASSIGNED"
      })
      .where(eq(pickupRequests.id, parsed.data.pickup_id))
      .returning({ status: pickupRequests.status, id: pickupRequests.id });

    if (pickup) {
      await writeAuditLog(tx, {
        actor: session.user,
        action: "ASSIGN_DRIVER",
        module: "PICKUP",
        entityId: pickup.id,
        detail: { driverId: parsed.data.driver_id }
      });
      await createNotification(tx, {
        userId: parsed.data.driver_id,
        type: "INFO",
        title: "Task baru masuk",
        message: "Admin menugaskan pickup baru untuk kamu.",
        module: "PICKUP",
        entityId: pickup.id
      });
    }

    return [pickup];
  });

  if (!updatedPickup) {
    return NextResponse.json({ message: "Pickup tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: updatedPickup.status });
}
