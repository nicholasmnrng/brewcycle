import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProductManagement } from "@/components/admin/product-management";
import { ProductCatalog } from "@/components/buyer/product-catalog";
import { DashboardHero } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/auth";
import { db } from "@/db";
import { products, promos } from "@/db/schema";
import { canAccessRoleRoute, dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessRoleRoute(session.user.role, ["ADMIN", "BUYER"])) {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const [productRows, promoRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(promos).where(eq(promos.status, "ACTIVE")).orderBy(desc(promos.createdAt)).limit(3)
  ]);
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <DashboardHero
        badge={isAdmin ? "Admin Produk" : "Marketplace"}
        title={isAdmin ? "Kelola Produk BrewCycle" : "Produk BrewCycle"}
        description={
          isAdmin
            ? "Tambah, edit, hapus, dan siapkan produk turunan ampas kopi untuk marketplace."
            : "Temukan produk turunan ampas kopi dengan filter kategori, stok, dan promo aktif."
        }
        cta={isAdmin ? { href: "/dashboard/promos", label: "Atur Promo" } : { href: "/dashboard/cart", label: "Lihat Cart" }}
      />

      {!isAdmin && promoRows.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {promoRows.map((promo) => (
            <Card key={promo.id} className="bg-coffee-dark text-white">
              <CardContent className="p-5">
                <Badge className="bg-white/15 text-white">Promo</Badge>
                <p className="mt-4 text-lg font-bold">{promo.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{promo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {isAdmin ? <ProductManagement products={productRows} /> : <ProductCatalog products={productRows} />}
    </div>
  );
}
