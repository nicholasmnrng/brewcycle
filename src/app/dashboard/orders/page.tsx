import { desc, eq } from "drizzle-orm";
import { OrderManagement } from "@/components/admin/order-management";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { orders, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orderRows = await db
    .select({
      id: orders.id,
      buyerName: users.name,
      totalPrice: orders.totalPrice,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentProofUrl: orders.paymentProofUrl,
      shippingRecipient: orders.shippingRecipient,
      shippingPhone: orders.shippingPhone,
      shippingAddress: orders.shippingAddress,
      shippingResi: orders.shippingResi
    })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Pesanan & Pembayaran</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Verifikasi transfer manual, input resi, dan update status order.
        </p>
      </div>

      {orderRows.length ? (
        <OrderManagement orders={orderRows} />
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Belum ada pesanan.</CardContent>
        </Card>
      )}
    </div>
  );
}
