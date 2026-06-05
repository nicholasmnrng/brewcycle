import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { rewards, rewardsCatalog, users } from "@/db/schema";

const redeemSchema = z.object({
  catalog_id: z.string().uuid(),
  points_used: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const parsed = redeemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Input reward tidak valid" }, { status: 400 });
  }

  const [catalog] = await db
    .select()
    .from(rewardsCatalog)
    .where(and(eq(rewardsCatalog.id, parsed.data.catalog_id), eq(rewardsCatalog.isActive, true)))
    .limit(1);

  if (!catalog) {
    return NextResponse.json({ success: false, message: "Reward tidak tersedia" }, { status: 404 });
  }

  if (catalog.stock <= 0) {
    return NextResponse.json({ success: false, message: "Stok reward habis" }, { status: 409 });
  }

  if (parsed.data.points_used !== catalog.pointsRequired) {
    return NextResponse.json({ success: false, message: "Jumlah poin tidak sesuai katalog" }, { status: 400 });
  }

  const [user] = await db
    .select({ totalPoints: users.totalPoints })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || user.totalPoints < catalog.pointsRequired) {
    return NextResponse.json({ success: false, message: "Poin tidak cukup" }, { status: 409 });
  }

  const newBalance = user.totalPoints - catalog.pointsRequired;

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ totalPoints: sql`${users.totalPoints} - ${catalog.pointsRequired}` })
      .where(eq(users.id, session.user.id));

    await tx
      .update(rewardsCatalog)
      .set({ stock: sql`${rewardsCatalog.stock} - 1` })
      .where(eq(rewardsCatalog.id, catalog.id));

    await tx.insert(rewards).values({
      userId: session.user.id,
      pointsDelta: -catalog.pointsRequired,
      type: "REDEEMED",
      description: `Redeem reward: ${catalog.name}`,
      refId: catalog.id
    });
  });

  return NextResponse.json({
    success: true,
    message: "Reward berhasil ditukar",
    new_balance: newBalance
  });
}
