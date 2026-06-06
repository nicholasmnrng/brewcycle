import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import { auth } from "@/auth";
import { RedeemRewardButton } from "@/components/rewards/redeem-reward-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { rewards, rewardsCatalog, users } from "@/db/schema";
import { dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CAFE") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const [userRows, history, catalog] = await Promise.all([
    db.select({ totalPoints: users.totalPoints }).from(users).where(eq(users.id, session.user.id)).limit(1),
    db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, session.user.id))
      .orderBy(desc(rewards.createdAt))
      .limit(20),
    db
      .select()
      .from(rewardsCatalog)
      .where(eq(rewardsCatalog.isActive, true))
      .orderBy(rewardsCatalog.pointsRequired)
  ]);
  const totalPoints = userRows[0]?.totalPoints ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Gamification</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Reward Center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Poin transparan dari pickup, pembelian, referral, dan redemption.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-slate-600">Saldo Poin</p>
            <p className="text-3xl font-bold text-slate-950">{totalPoints}</p>
          </div>
          <Gift className="h-8 w-8 text-primary" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.map((reward) => (
          <Card key={reward.id}>
            <CardHeader>
              <CardTitle className="text-base">{reward.name}</CardTitle>
              <p className="text-sm text-slate-600">{reward.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge>{reward.pointsRequired} poin</Badge>
                <Badge variant="outline">Stok {reward.stock}</Badge>
              </div>
              <RedeemRewardButton catalogId={reward.id} pointsRequired={reward.pointsRequired} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Poin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.description}</p>
                <p className="text-xs text-slate-500">{item.type}</p>
              </div>
              <p className={item.pointsDelta >= 0 ? "font-bold text-primary" : "font-bold text-destructive"}>
                {item.pointsDelta >= 0 ? "+" : ""}
                {item.pointsDelta}
              </p>
            </div>
          ))}
          {!history.length ? <p className="text-sm text-slate-600">Belum ada riwayat poin.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
