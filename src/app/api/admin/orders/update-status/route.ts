import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";

const statusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["PACKED", "SHIPPED", "COMPLETED", "CANCELLED"]),
  shipping_resi: z.string().optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa update order" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input status tidak valid" }, { status: 400 });
  }

  const [order] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({
        status: parsed.data.status,
        shippingResi: parsed.data.shipping_resi
      })
      .where(eq(orders.id, parsed.data.order_id))
      .returning({ status: orders.status, id: orders.id, buyerId: orders.buyerId });

    if (updated) {
      await writeAuditLog(tx, {
        actor: session.user,
        action: "UPDATE_ORDER_STATUS",
        module: "ORDER",
        entityId: updated.id,
        detail: { status: updated.status, shippingResi: parsed.data.shipping_resi }
      });
      await createNotification(tx, {
        userId: updated.buyerId,
        type: "INFO",
        title: "Status order diperbarui",
        message: `Order #${updated.id.slice(0, 8)} sekarang ${updated.status}.`,
        module: "ORDER",
        entityId: updated.id
      });
    }

    return [updated];
  });

  if (!order) {
    return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: order.status });
}
