import { and, eq, sql } from "drizzle-orm";
import { rewards, users } from "@/db/schema";
import { purchasePoints } from "@/lib/orders";

type RewardTx = {
  select: Function;
  insert: Function;
  update: Function;
};

export async function awardReferralBonus(tx: RewardTx, userId: string, refId: string) {
  const [user] = await tx
    .select({
      referredById: users.referredById,
      referralBonusAwarded: users.referralBonusAwarded
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.referredById || user.referralBonusAwarded) {
    return;
  }

  await tx
    .update(users)
    .set({ totalPoints: sql`${users.totalPoints} + 50` })
    .where(eq(users.id, user.referredById));

  await tx.insert(rewards).values({
    userId: user.referredById,
    pointsDelta: 50,
    type: "EARNED_REFERRAL",
    description: "Bonus referral transaksi/pickup pertama referee",
    refId
  });

  await tx
    .update(users)
    .set({ referralBonusAwarded: true })
    .where(eq(users.id, userId));
}

export async function awardPurchasePoints(tx: RewardTx, buyerId: string, totalPrice: number, orderId: string) {
  const points = purchasePoints(totalPrice);

  if (points <= 0) {
    return 0;
  }

  const existing = await tx
    .select({ id: rewards.id })
    .from(rewards)
    .where(and(eq(rewards.userId, buyerId), eq(rewards.refId, orderId), eq(rewards.type, "EARNED_PURCHASE")))
    .limit(1);

  if (existing.length > 0) {
    return 0;
  }

  await tx
    .update(users)
    .set({ totalPoints: sql`${users.totalPoints} + ${points}` })
    .where(eq(users.id, buyerId));

  await tx.insert(rewards).values({
    userId: buyerId,
    pointsDelta: points,
    type: "EARNED_PURCHASE",
    description: `Poin pembelian order #${orderId.slice(0, 8)}`,
    refId: orderId
  });

  return points;
}
