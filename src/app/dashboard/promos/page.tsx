import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PromoManagement } from "@/components/admin/promo-management";
import { DashboardHero, StatCard } from "@/components/dashboard/primitives";
import { db } from "@/db";
import { products, promos } from "@/db/schema";
import { dashboardHomeForRole } from "@/lib/role-routing";
import { Sparkles, Tags } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const [promoRows, productRows] = await Promise.all([
    db.select().from(promos).orderBy(desc(promos.createdAt)),
    db.select({ id: products.id, name: products.name }).from(products).orderBy(desc(products.createdAt))
  ]);

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Promo Management"
        description="Buat, aktifkan, jadwalkan, atau nonaktifkan promo produk yang tampil ke Buyer."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total Promo" value={promoRows.length} icon={Sparkles} />
        <StatCard label="Produk Tersedia" value={productRows.length} icon={Tags} tone="coffee" />
      </div>
      <PromoManagement promos={promoRows} products={productRows} />
    </div>
  );
}
