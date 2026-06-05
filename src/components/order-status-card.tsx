import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/orders";

export function OrderStatusCard({
  order,
  action
}: {
  order: {
    id: string;
    buyerName?: string;
    totalPrice: string;
    status: string;
    paymentStatus: string;
    paymentProofUrl: string | null;
    shippingAddress?: string | null;
    shippingRecipient?: string | null;
    shippingPhone?: string | null;
  };
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {order.buyerName ? `${order.buyerName} - ` : ""}
            {formatRupiah(order.totalPrice)}
          </p>
          {order.shippingAddress ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {order.shippingRecipient ?? order.buyerName ?? "Penerima"} ({order.shippingPhone ?? "-"}) -{" "}
              {order.shippingAddress}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge>{order.status}</Badge>
          <Badge variant={order.paymentStatus === "REJECTED" ? "destructive" : "secondary"}>
            {order.paymentStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.paymentProofUrl ? (
          <Image
            src={order.paymentProofUrl}
            alt={`Bukti transfer order ${order.id}`}
            width={900}
            height={520}
            unoptimized
            className="max-h-72 w-full rounded-2xl border object-contain"
          />
        ) : (
          <div className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">Bukti transfer belum diupload.</div>
        )}
        {action}
      </CardContent>
    </Card>
  );
}
