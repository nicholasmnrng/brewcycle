import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests } from "@/db/schema";
import { distanceInMeters } from "@/lib/pickup";

const checkInSchema = z.object({
  pickup_id: z.string().uuid(),
  lat: z.coerce.number(),
  lng: z.coerce.number()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DRIVER") {
    return NextResponse.json({ message: "Hanya Driver yang bisa check-in" }, { status: 403 });
  }

  const parsed = checkInSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input GPS tidak valid" }, { status: 400 });
  }

  const [currentPickup] = await db
    .select({
      id: pickupRequests.id,
      pickupLatitude: pickupRequests.pickupLatitude,
      pickupLongitude: pickupRequests.pickupLongitude
    })
    .from(pickupRequests)
    .where(and(eq(pickupRequests.id, parsed.data.pickup_id), eq(pickupRequests.driverId, session.user.id)))
    .limit(1);

  if (!currentPickup) {
    return NextResponse.json({ message: "Pickup tidak ditemukan untuk driver ini" }, { status: 404 });
  }

  if (!currentPickup.pickupLatitude || !currentPickup.pickupLongitude) {
    return NextResponse.json({ message: "Titik GPS pickup belum tersedia" }, { status: 409 });
  }

  const center = {
    lat: Number(currentPickup.pickupLatitude),
    lng: Number(currentPickup.pickupLongitude)
  };
  const distance = distanceInMeters({ lat: parsed.data.lat, lng: parsed.data.lng }, center);

  if (distance >= 100) {
    return NextResponse.json(
      { message: "Driver harus berada dalam radius 100m dari titik pickup", distance_meters: distance },
      { status: 409 }
    );
  }

  const [pickup] = await db
    .update(pickupRequests)
    .set({ status: "IN_TRANSIT" })
    .where(
      and(eq(pickupRequests.id, parsed.data.pickup_id), eq(pickupRequests.driverId, session.user.id))
    )
    .returning({ status: pickupRequests.status });

  return NextResponse.json({
    status: pickup.status,
    otp_hint: "Minta kode OTP ke Kafe"
  });
}
