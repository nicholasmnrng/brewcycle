import { desc } from "drizzle-orm";
import { GamificationManagement } from "@/components/admin/gamification-management";
import { DashboardHero, StatCard } from "@/components/dashboard/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { gamificationConfig, rewardsCatalog } from "@/db/schema";
import { Gift, ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GamificationPage() {
  const [configs, catalog] = await Promise.all([
    db.select().from(gamificationConfig).orderBy(desc(gamificationConfig.createdAt)),
    db.select().from(rewardsCatalog)
  ]);

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Gamification & Reward Management"
        description="Atur aturan poin dan pantau katalog reward. Buyer gamification disembunyikan dari UI, promo menjadi incentive utama Buyer."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Rule Aktif" value={configs.filter((item) => item.isActive).length} icon={ListChecks} />
        <StatCard label="Reward Catalog" value={catalog.length} icon={Gift} tone="amber" />
      </div>
      <GamificationManagement configs={configs} />
      <Card>
        <CardHeader>
          <CardTitle>Katalog Reward</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {catalog.map((reward) => (
            <div key={reward.id} className="rounded-2xl border bg-white p-4">
              <p className="font-semibold text-slate-950">{reward.name}</p>
              <p className="mt-1 text-sm text-slate-500">{reward.description}</p>
              <p className="mt-3 text-sm font-bold text-primary">{reward.pointsRequired} poin - stok {reward.stock}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
