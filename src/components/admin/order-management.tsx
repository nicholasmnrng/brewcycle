"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, PackageCheck, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/notifications/toast-provider";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { OrderStatusCard } from "@/components/order-status-card";

type OrderRow = {
  id: string;
  buyerName: string;
  totalPrice: string;
  status: string;
  paymentStatus: string;
  paymentProofUrl: string | null;
  shippingRecipient: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingResi: string | null;
};

export function OrderManagement({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; action: "APPROVE" | "REJECT" } | null>(null);
  const [isPending, startTransition] = useTransition();

  function verify(orderId: string, action: "APPROVE" | "REJECT") {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, action })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Verifikasi gagal");
        notify({ title: "Verifikasi gagal", description: data.message, type: "error" });
        return;
      }

      setMessage(`Order menjadi ${data.status}`);
      notify({ title: "Verifikasi berhasil", description: `Order menjadi ${data.status}`, type: "success", browser: true });
      setConfirmAction(null);
      router.refresh();
    });
  }

  function updateStatus(event: React.FormEvent<HTMLFormElement>, orderId: string, status: string) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status,
          shipping_resi: formData.get("shipping_resi")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Update status gagal");
        notify({ title: "Update status gagal", description: data.message, type: "error" });
        return;
      }

      setMessage(`Status order: ${data.status}`);
      notify({ title: "Status order diperbarui", description: `Status: ${data.status}`, type: "success", browser: true });
      router.refresh();
    });
  }

  function completeOrder(orderId: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: "COMPLETED" })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Update status gagal");
        notify({ title: "Update status gagal", description: data.message, type: "error" });
        return;
      }

      setMessage(`Status order: ${data.status}`);
      notify({ title: "Order completed", description: `Status: ${data.status}`, type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-primary">{message}</p> : null}
      {orders.map((order) => (
        <OrderStatusCard
          key={order.id}
          order={order}
          action={
            <div className="space-y-4">
              {order.paymentStatus === "PENDING" ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={isPending} onClick={() => setConfirmAction({ orderId: order.id, action: "APPROVE" })}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setConfirmAction({ orderId: order.id, action: "REJECT" })}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
              ) : (
                <p className="rounded-2xl bg-coffee-soft p-3 text-sm text-slate-500">
                  Order ini sudah keluar dari antrian verifikasi pembayaran.
                </p>
              )}
            <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={(event) => updateStatus(event, order.id, "SHIPPED")}>
              <Input name="shipping_resi" placeholder="Nomor resi" defaultValue={order.shippingResi ?? ""} />
              <Button variant="secondary" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Shipped
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => completeOrder(order.id)}>
                <PackageCheck className="h-4 w-4" />
                Completed
              </Button>
            </form>
            </div>
          }
        />
      ))}
      <ConfirmationModal
        open={Boolean(confirmAction)}
        title={confirmAction?.action === "APPROVE" ? "Approve pembayaran?" : "Reject pembayaran?"}
        description={
          confirmAction?.action === "APPROVE"
            ? "Order akan masuk ke status PACKED dan keluar dari antrian pending."
            : "Pembayaran akan ditandai REJECTED dan buyer akan mendapat notifikasi."
        }
        confirmLabel={confirmAction?.action === "APPROVE" ? "Approve" : "Reject"}
        destructive={confirmAction?.action === "REJECT"}
        isPending={isPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && verify(confirmAction.orderId, confirmAction.action)}
      />
    </div>
  );
}
