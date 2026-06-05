import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import Image from "next/image";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatRupiah } from "@/lib/orders";

export const dynamic = "force-dynamic";

const orderSteps = ["PENDING", "PACKED", "SHIPPED", "COMPLETED"] as const;

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUYER") {
    return (
      <div className="space-y-6">
        <div>
          <Badge variant="secondary">Riwayat</Badge>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Riwayat pickup dan aktivitas role ini akan mengikuti modul terkait.
          </p>
        </div>
      </div>
    );
  }

  const buyerOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalPrice: orders.totalPrice,
      shippingResi: orders.shippingResi,
      paymentProofUrl: orders.paymentProofUrl,
      createdAt: orders.createdAt
    })
    .from(orders)
    .where(eq(orders.buyerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Buyer</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Tracking Pesanan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Stepper vertikal di mobile dan horizontal di desktop untuk status pesanan.
        </p>
      </div>

      <div className="space-y-4">
        {buyerOrders.map((order) => {
          const activeIndex = Math.max(0, orderSteps.indexOf(order.status as (typeof orderSteps)[number]));

          return (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">{formatRupiah(order.totalPrice)}</p>
                </div>
                <Badge variant={order.paymentStatus === "REJECTED" ? "destructive" : "secondary"}>
                  Payment {order.paymentStatus}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  {orderSteps.map((step, index) => (
                    <div
                      key={step}
                      className={
                        index <= activeIndex
                          ? "rounded-xl border border-green-200 bg-green-50 p-3 text-primary"
                          : "rounded-xl border bg-white p-3 text-slate-500"
                      }
                    >
                      <p className="text-sm font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
                {order.shippingResi ? (
                  <p className="text-sm text-slate-600">Resi: {order.shippingResi}</p>
                ) : null}
                {order.paymentProofUrl ? (
                  <Image
                    src={order.paymentProofUrl}
                    alt={`Bukti pembayaran order ${order.id}`}
                    width={900}
                    height={520}
                    unoptimized
                    className="max-h-64 w-full rounded-2xl border object-contain"
                  />
                ) : (
                  <p className="rounded-2xl bg-coffee-soft p-3 text-sm text-slate-500">
                    Bukti pembayaran belum diupload.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!buyerOrders.length ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
              <History className="h-5 w-5 text-primary" />
              Belum ada pesanan. Tambahkan produk ke cart untuk mulai checkout.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
