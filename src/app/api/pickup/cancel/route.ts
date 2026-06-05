import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests } from "@/db/schema";

const cancelSchema = z.object({
  pickup_id: z.string().uuid()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "CAFE") {
    return NextResponse.json({ message: "Hanya Kafe yang bisa membatalkan pickup" }, { status: 403 });
  }

  const parsed = cancelSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Pickup tidak valid" }, { status: 400 });
  }

  const [pickup] = await db
    .update(pickupRequests)
    .set({ otpCode: null, status: "CANCELLED" })
    .where(
      and(
        eq(pickupRequests.id, parsed.data.pickup_id),
        eq(pickupRequests.cafeId, session.user.id),
        inArray(pickupRequests.status, ["PENDING", "ASSIGNED", "RESCHEDULED"])
      )
    )
    .returning({ status: pickupRequests.status });

  if (!pickup) {
    return NextResponse.json(
      { message: "Pickup hanya bisa dibatalkan saat PENDING, ASSIGNED, atau RESCHEDULED" },
      { status: 409 }
    );
  }

  return NextResponse.json({ status: pickup.status });
}
