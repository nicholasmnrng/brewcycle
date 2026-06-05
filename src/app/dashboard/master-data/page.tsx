import { desc } from "drizzle-orm";
import { DashboardHero } from "@/components/dashboard/primitives";
import { MasterDataClient } from "@/components/admin/master-data-client";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      driverOnline: users.driverOnline
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Master Data Akun"
        description="Kelola akun Admin, Cafe, Driver, dan Buyer. Search, filter, dan aktif/nonaktif akun dari satu tempat."
      />
      <MasterDataClient users={rows} />
    </div>
  );
}
