import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { pickupRequests, rewards, users } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";
import { fileToDataUrl } from "@/lib/files";
import { awardReferralBonus } from "@/lib/rewards";

const maxPhotoSize = 5 * 1024 * 1024;
const allowedPhotoTypes = ["image/jpeg", "image/png"];

const completeSchema = z.object({
  pickup_id: z.string().uuid(),
  otp_input: z.string().regex(/^\d{6}$/, "OTP harus 6 digit"),
  actual_weight: z.coerce.number().positive("Berat tidak boleh nol")
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DRIVER") {
    return NextResponse.json({ message: "Hanya Driver yang bisa complete pickup" }, { status: 403 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  const parsed = completeSchema.safeParse({
    pickup_id: formData.get("pickup_id"),
    otp_input: formData.get("otp_input"),
    actual_weight: formData.get("actual_weight")
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  if (!(photo instanceof File)) {
    return NextResponse.json({ message: "Bukti foto wajib diupload" }, { status: 400 });
  }

  if (!allowedPhotoTypes.includes(photo.type) || photo.size > maxPhotoSize) {
    return NextResponse.json(
      { message: "Bukti foto harus .jpg/.png dan maksimal 5MB" },
      { status: 400 }
    );
  }

  const [pickup] = await db
    .select()
    .from(pickupRequests)
    .where(
      and(eq(pickupRequests.id, parsed.data.pickup_id), eq(pickupRequests.driverId, session.user.id))
    )
    .limit(1);

  if (!pickup || !pickup.otpCodeHash) {
    return NextResponse.json({ message: "Pickup tidak ditemukan" }, { status: 404 });
  }

  if (pickup.status !== "IN_TRANSIT" && pickup.status !== "WAITING_OTP") {
    return NextResponse.json(
      { message: "Pickup harus check-in sebelum diselesaikan" },
      { status: 409 }
    );
  }

  if (pickup.otpExpiresAt && pickup.otpExpiresAt < new Date()) {
    return NextResponse.json({ message: "OTP sudah hangus" }, { status: 409 });
  }

  const isOtpValid = await bcrypt.compare(parsed.data.otp_input, pickup.otpCodeHash);

  if (!isOtpValid) {
    const attempts = pickup.otpAttempts + 1;
    const failed = attempts >= 3;
    await db
      .update(pickupRequests)
      .set({
        otpAttempts: attempts,
        status: failed ? "FAILED" : "WAITING_OTP"
      })
      .where(eq(pickupRequests.id, pickup.id));

    return NextResponse.json(
      {
        message: failed
          ? "OTP salah 3 kali. Pickup membutuhkan intervensi Admin."
          : "OTP salah. Coba lagi.",
        status: failed ? "FAILED" : "WAITING_OTP",
        attempts
      },
      { status: 409 }
    );
  }

  const pointsEarned = Math.floor(parsed.data.actual_weight * 10);
  const proofPhotoUrl = await fileToDataUrl(photo);

  await db.transaction(async (tx) => {
    await tx
      .update(pickupRequests)
      .set({
        actualWeight: parsed.data.actual_weight.toFixed(2),
        proofPhotoUrl,
        otpCode: null,
        status: "COMPLETED"
      })
      .where(eq(pickupRequests.id, pickup.id));

    await tx
      .update(users)
      .set({ totalPoints: sql`${users.totalPoints} + ${pointsEarned}` })
      .where(eq(users.id, pickup.cafeId));

    await tx.insert(rewards).values({
      userId: pickup.cafeId,
      pointsDelta: pointsEarned,
      type: "EARNED_PICKUP",
      description: `Pickup selesai: ${parsed.data.actual_weight.toFixed(2)} kg ampas kopi`,
      refId: pickup.id
    });

    await awardReferralBonus(tx, pickup.cafeId, pickup.id);
    await writeAuditLog(tx, {
      actor: session.user,
      action: "UPLOAD_PICKUP_PROOF",
      module: "PICKUP",
      entityId: pickup.id,
      detail: { weight: parsed.data.actual_weight }
    });
    await createNotification(tx, {
      role: "ADMIN",
      type: "INFO",
      title: "Bukti pickup baru masuk",
      message: `Driver mengupload bukti pickup ${parsed.data.actual_weight.toFixed(2)} kg.`,
      module: "PICKUP",
      entityId: pickup.id
    });
  });

  return NextResponse.json({
    status: "COMPLETED",
    points_earned: pointsEarned
  });
}
