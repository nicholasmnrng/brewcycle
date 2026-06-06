import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { products, promos } from "@/db/schema";
import { formatRupiah } from "@/lib/orders";
import { canAccessRoleRoute, dashboardHomeForRole } from "@/lib/role-routing";
import { bestPromoForProduct } from "@/lib/promos";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessRoleRoute(session.user.role, ["ADMIN", "BUYER"])) {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const [productRows, promoRows] = await Promise.all([
    db.select().from(products).where(eq(products.id, params.id)).limit(1),
    db.select().from(promos).where(eq(promos.status, "ACTIVE"))
  ]);
  const product = productRows[0];

  if (!product) {
    notFound();
  }

  const activePromo = bestPromoForProduct(product.id, Number(product.price), promoRows);
  const productWithPromo = { ...product, activePromo };

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={900}
            height={560}
            unoptimized
            className="h-80 w-full rounded-xl border object-cover"
          />
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-xl border bg-green-50 text-primary">
            <span className="text-lg font-semibold">{product.category}</span>
          </div>
        )}
        <Card>
          <CardHeader>
            <Badge variant="secondary">{product.category}</Badge>
            <CardTitle className="mt-2 text-2xl">{product.name}</CardTitle>
            <p className="text-sm leading-6 text-slate-600">{product.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePromo ? (
              <div className="space-y-1">
                <Badge variant="warning">Promo {activePromo.discountLabel}</Badge>
                <p className="text-3xl font-bold text-slate-950">{formatRupiah(activePromo.finalPrice)}</p>
                <p className="text-sm text-slate-400 line-through">{formatRupiah(activePromo.originalPrice)}</p>
                <p className="text-sm font-medium text-primary">{activePromo.title}</p>
              </div>
            ) : (
              <p className="text-3xl font-bold text-slate-950">{formatRupiah(product.price)}</p>
            )}
            <p className="text-sm text-slate-600">Stok {product.stock} {product.unit}</p>
            {product.usageGuide ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-950">Panduan pakai</p>
                <p className="mt-1">{product.usageGuide}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-white p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto max-w-md sm:mx-0">
          {session?.user.role === "BUYER" ? <AddToCartButton product={productWithPromo} /> : null}
        </div>
      </div>
    </div>
  );
}
