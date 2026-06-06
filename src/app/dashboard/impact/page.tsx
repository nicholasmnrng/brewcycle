import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { BarChart3, Leaf, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { InteractiveChartCard } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { environmentalConfig, pickupRequests } from "@/db/schema";
import { canAccessRoleRoute, dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessRoleRoute(session.user.role, ["ADMIN", "CAFE"])) {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const configs = await db.select().from(environmentalConfig);
  const configMap = new Map(configs.map((config) => [config.key, Number(config.value)]));
  const co2Factor = configMap.get("co2_per_kg") ?? 2.5;
  const methaneFactor = configMap.get("methane_per_kg") ?? 0.1;
  const treesFactor = configMap.get("trees_per_kg") ?? 0.01;

  const whereClause =
    session.user.role === "CAFE"
      ? sql`${pickupRequests.status} = 'COMPLETED' and ${pickupRequests.cafeId} = ${session.user.id}`
      : sql`${pickupRequests.status} = 'COMPLETED'`;

  const [summary] = await db
    .select({
      wasteKg: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)`
    })
    .from(pickupRequests)
    .where(whereClause);

  const monthly = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${pickupRequests.scheduleDate}), 'YYYY-MM')`,
      wasteKg: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)`
    })
    .from(pickupRequests)
    .where(whereClause)
    .groupBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
    .orderBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`);

  const wasteKg = Number(summary?.wasteKg ?? 0);
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Impact</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Dampak Lingkungan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Kalkulasi otomatis dari pickup COMPLETED dengan koefisien PRD.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric title="Ampas Terolah" value={`${wasteKg.toFixed(1)} kg`} icon={Leaf} />
        <Metric title="CO2" value={`${(wasteKg * co2Factor).toFixed(1)} kg`} icon={BarChart3} />
        <Metric title="Methane" value={`${(wasteKg * methaneFactor).toFixed(1)} kg`} icon={BarChart3} />
        <Metric title="Pohon" value={`${(wasteKg * treesFactor).toFixed(2)}`} icon={Sprout} />
      </div>

      {monthly.length ? (
        <InteractiveChartCard
          title="Tren Bulanan"
          description="Grafik interaktif dampak limbah kopi yang sudah completed."
          data={monthly.map((item) => ({ label: item.month, value: Number(item.wasteKg) }))}
          dataKey="value"
          type="area"
        />
      ) : (
        <EmptyState
          icon={Leaf}
          title="Belum ada data impact"
          description="Impact akan muncul setelah pickup selesai dan berat aktual tercatat."
          actionLabel={session.user.role === "CAFE" ? "Jadwalkan Pickup" : "Buka Logistik"}
          actionHref={session.user.role === "CAFE" ? "/dashboard/pickup" : "/dashboard/logistics"}
        />
      )}
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
