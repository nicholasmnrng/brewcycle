import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests } from "@/db/schema";
import { createScheduleDate, generateOtpCode, getNextReminder, hashOtpCode } from "@/lib/pickup";

const requestSchema = z.object({
  estimated_weight: z.coerce.number().positive("Berat tidak boleh nol"),
  schedule_date: z.string().min(1, "Tanggal wajib dipilih"),
  slot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  pickup_address: z.string().min(10, "Alamat pickup minimal 10 karakter"),
  pickup_latitude: z.coerce.number().min(-90).max(90),
  pickup_longitude: z.coerce.number().min(-180).max(180),
  contact_name: z.string().min(2, "Nama PIC wajib diisi"),
  contact_phone: z.string().min(8, "Nomor PIC minimal 8 karakter"),
  zone: z.string().min(2, "Zona area wajib diisi"),
  pickup_notes: z.string().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "CAFE") {
    return NextResponse.json({ message: "Hanya Kafe yang bisa membuat request pickup" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const scheduleDate = createScheduleDate(parsed.data.schedule_date, parsed.data.slot);
  const otpCode = generateOtpCode();
  const otpCodeHash = await hashOtpCode(otpCode);
  const otpExpiresAt = new Date(scheduleDate);
  otpExpiresAt.setHours(23, 59, 59, 999);

  const [pickup] = await db
    .insert(pickupRequests)
    .values({
      cafeId: session.user.id,
      estimatedWeight: parsed.data.estimated_weight.toFixed(2),
      pickupAddress: parsed.data.pickup_address,
      pickupLatitude: parsed.data.pickup_latitude.toFixed(7),
      pickupLongitude: parsed.data.pickup_longitude.toFixed(7),
      contactName: parsed.data.contact_name,
      contactPhone: parsed.data.contact_phone,
      pickupNotes: parsed.data.pickup_notes || null,
      zone: parsed.data.zone,
      status: "PENDING",
      scheduleDate,
      originalScheduleDate: scheduleDate,
      otpCode,
      otpCodeHash,
      otpExpiresAt
    })
    .returning({
      id: pickupRequests.id,
      status: pickupRequests.status
    });

  return NextResponse.json(
    {
      id: pickup.id,
      status: pickup.status,
      next_reminder: getNextReminder(scheduleDate).toISOString(),
      otp_code: otpCode
    },
    { status: 201 }
  );
}
