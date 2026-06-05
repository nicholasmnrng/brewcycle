import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";
import { awardPurchasePoints, awardReferralBonus } from "@/lib/rewards";

const verifyPaymentSchema = z.object({
  order_id: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa verifikasi pembayaran" }, { status: 403 });
  }

  const parsed = verifyPaymentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input verifikasi tidak valid" }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, parsed.data.order_id)).limit(1);

  if (!order) {
    return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
  }

  if (parsed.data.action === "REJECT") {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "PENDING", paymentStatus: "REJECTED" })
        .where(eq(orders.id, order.id));
      await writeAuditLog(tx, {
        actor: session.user,
        action: "REJECT_ORDER_PAYMENT",
        module: "ORDER",
        entityId: order.id,
        detail: { note: parsed.data.note }
      });
      await createNotification(tx, {
        userId: order.buyerId,
        type: "WARNING",
        title: "Pembayaran ditolak",
        message: `Order #${order.id.slice(0, 8)} perlu upload ulang bukti pembayaran.`,
        module: "ORDER",
        entityId: order.id
      });
    });

    return NextResponse.json({ status: "PENDING" });
  }

  let pointsEarned = 0;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "PACKED", paymentStatus: "VERIFIED" })
      .where(eq(orders.id, order.id));

    pointsEarned = await awardPurchasePoints(tx, order.buyerId, Number(order.totalPrice), order.id);
    await awardReferralBonus(tx, order.buyerId, order.id);
    await writeAuditLog(tx, {
      actor: session.user,
      action: "APPROVE_ORDER_PAYMENT",
      module: "ORDER",
      entityId: order.id,
      detail: { pointsEarned }
    });
    await createNotification(tx, {
      userId: order.buyerId,
      type: "SUCCESS",
      title: "Pembayaran diverifikasi",
      message: `Order #${order.id.slice(0, 8)} sedang diproses.`,
      module: "ORDER",
      entityId: order.id
    });
  });

  return NextResponse.json({ status: "PACKED", points_earned: pointsEarned });
}
