import { desc, sql } from "drizzle-orm";
import { BarChart3, Download, Package, ShoppingCart, Truck } from "lucide-react";
import { DashboardHero, StatCard } from "@/components/dashboard/primitives";
import { InteractiveChartCard } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { orders, pickupRequests, products, promos, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const exports = [
    { label: "Orders CSV", href: "/api/admin/export?type=orders&format=csv" },
    { label: "Pickups CSV", href: "/api/admin/export?type=pickups&format=csv" },
    { label: "Products CSV", href: "/api/admin/export?type=products&format=csv" },
    { label: "Orders PDF", href: "/api/admin/export?type=orders&format=pdf" }
  ];

  const [pickupSummary, orderSummary, productSummary, promoSummary, pickupChart, wasteChart, orderChart, roleChart, recentPickups] =
    await Promise.all([
      db.select({ value: sql<string>`count(*)` }).from(pickupRequests),
      db.select({ value: sql<string>`count(*)` }).from(orders),
      db.select({ value: sql<string>`count(*)` }).from(products),
      db.select({ value: sql<string>`count(*)` }).from(promos),
      db
        .select({ label: sql<string>`to_char(date_trunc('month', ${pickupRequests.scheduleDate}), 'Mon')`, value: sql<string>`count(*)` })
        .from(pickupRequests)
        .groupBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
        .orderBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`),
      db
        .select({ label: sql<string>`to_char(date_trunc('month', ${pickupRequests.scheduleDate}), 'Mon')`, value: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)` })
        .from(pickupRequests)
        .groupBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
        .orderBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`),
      db
        .select({ label: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'Mon')`, value: sql<string>`count(*)` })
        .from(orders)
        .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
        .orderBy(sql`date_trunc('month', ${orders.createdAt})`),
      db.select({ label: users.role, value: sql<string>`count(*)` }).from(users).groupBy(users.role),
      db.select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt)).limit(8)
    ]);

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Laporan Operasional"
        description="Visualisasi data pickup, limbah, driver, cafe, buyer, order, produk, promo, reward, dan pembayaran."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pickup" value={Number(pickupSummary[0]?.value ?? 0)} icon={Truck} />
        <StatCard label="Total Order" value={Number(orderSummary[0]?.value ?? 0)} icon={ShoppingCart} />
        <StatCard label="Produk" value={Number(productSummary[0]?.value ?? 0)} icon={Package} tone="coffee" />
        <StatCard label="Promo" value={Number(promoSummary[0]?.value ?? 0)} icon={BarChart3} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InteractiveChartCard title="Pickup Bulanan" data={normalize(pickupChart)} dataKey="value" type="bar" />
        <InteractiveChartCard title="Limbah Bulanan" data={normalize(wasteChart)} dataKey="value" type="area" />
        <InteractiveChartCard title="Order Bulanan" data={normalize(orderChart)} dataKey="value" type="line" />
        <InteractiveChartCard title="Distribusi Role" data={normalize(roleChart)} dataKey="value" type="pie" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {exports.map((item) => (
            <Button key={item.href} asChild variant="outline">
              <a href={item.href}>
                <Download className="h-4 w-4" />
                {item.label}
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Pickup Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentPickups.map((pickup) => (
            <div key={pickup.id} className="flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">Pickup #{pickup.id.slice(0, 8)}</p>
                <p className="text-sm text-slate-500">
                  Estimasi {pickup.estimatedWeight} kg, aktual {pickup.actualWeight ?? "-"} kg
                </p>
              </div>
              <Badge>{pickup.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function normalize(rows: Array<{ label: string; value: string | number }>) {
  return rows.map((row) => ({ label: row.label, value: Number(row.value) }));
}
