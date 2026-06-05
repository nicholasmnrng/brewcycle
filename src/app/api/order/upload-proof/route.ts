import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";
import { fileToDataUrl } from "@/lib/files";

const uploadProofSchema = z.object({
  order_id: z.string().uuid()
});

const maxProofSize = 5 * 1024 * 1024;
const allowedProofTypes = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "BUYER") {
    return NextResponse.json({ message: "Hanya Buyer yang bisa upload bukti" }, { status: 403 });
  }

  const formData = await request.formData();
  const proof = formData.get("proof");
  const parsed = uploadProofSchema.safeParse({ order_id: formData.get("order_id") });

  if (!parsed.success) {
    return NextResponse.json({ message: "Order tidak valid" }, { status: 400 });
  }

  if (!(proof instanceof File)) {
    return NextResponse.json({ message: "Bukti transfer wajib diupload" }, { status: 400 });
  }

  if (!allowedProofTypes.includes(proof.type) || proof.size > maxProofSize) {
    return NextResponse.json(
      { message: "Bukti transfer harus .jpg/.png dan maksimal 5MB" },
      { status: 400 }
    );
  }

  const proofUrl = await fileToDataUrl(proof);
  const [updatedOrder] = await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({
        paymentProofUrl: proofUrl,
        paymentStatus: "PENDING"
      })
      .where(and(eq(orders.id, parsed.data.order_id), eq(orders.buyerId, session.user.id)))
      .returning({ id: orders.id });

    if (order) {
      await writeAuditLog(tx, {
        actor: session.user,
        action: "UPLOAD_PAYMENT_PROOF",
        module: "ORDER",
        entityId: order.id
      });
      await createNotification(tx, {
        role: "ADMIN",
        type: "INFO",
        title: "Bukti pembayaran baru",
        message: `Buyer mengupload bukti pembayaran order #${order.id.slice(0, 8)}.`,
        module: "ORDER",
        entityId: order.id
      });
    }

    return [order];
  });

  if (!updatedOrder) {
    return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ status: "VERIFICATION_PENDING" });
}
