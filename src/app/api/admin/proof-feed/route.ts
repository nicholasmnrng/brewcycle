import { NextResponse } from "next/server";
import { desc, eq, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders, pickupRequests, users } from "@/db/schema";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa melihat proof feed" }, { status: 403 });
  }

  const [pickupProofs, paymentProofs] = await Promise.all([
    db
      .select({
        id: pickupRequests.id,
        title: users.name,
        status: pickupRequests.status,
        imageUrl: pickupRequests.proofPhotoUrl,
        createdAt: pickupRequests.createdAt
      })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .where(isNotNull(pickupRequests.proofPhotoUrl))
      .orderBy(desc(pickupRequests.createdAt))
      .limit(8),
    db
      .select({
        id: orders.id,
        title: users.name,
        status: orders.paymentStatus,
        imageUrl: orders.paymentProofUrl,
        createdAt: orders.createdAt
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(isNotNull(orders.paymentProofUrl))
      .orderBy(desc(orders.createdAt))
      .limit(8)
  ]);

  return NextResponse.json({
    items: [
      ...pickupProofs.map((item) => ({ ...item, kind: "pickup", createdAt: item.createdAt.toISOString() })),
      ...paymentProofs.map((item) => ({ ...item, kind: "payment", createdAt: item.createdAt.toISOString() }))
    ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  });
}
