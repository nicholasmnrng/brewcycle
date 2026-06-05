import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { environmentalConfig, pickupRequests } from "@/db/schema";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json({
    co2_saved: wasteKg * co2Factor,
    methane_saved: wasteKg * methaneFactor,
    trees_saved: wasteKg * treesFactor,
    waste_kg: wasteKg,
    monthly: monthly.map((item) => {
      const monthWaste = Number(item.wasteKg);
      return {
        month: item.month,
        waste_kg: monthWaste,
        co2_saved: monthWaste * co2Factor,
        methane_saved: monthWaste * methaneFactor,
        trees_saved: monthWaste * treesFactor
      };
    })
  });
}
