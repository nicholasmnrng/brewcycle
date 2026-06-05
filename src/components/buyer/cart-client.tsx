"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Minus, PackageCheck, Plus, Trash2, Upload } from "lucide-react";
import { formatRupiah } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/notifications/toast-provider";

type CartItem = {
  product_id: string;
  name: string;
  price: string;
  qty: number;
  imageUrl?: string | null;
};

export function CartClient() {
  const router = useRouter();
  const { notify } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0),
    [items]
  );

  useEffect(() => {
    setItems(JSON.parse(window.localStorage.getItem("brewcycle-cart") ?? "[]"));
  }, []);

  function persist(nextItems: CartItem[]) {
    setItems(nextItems);
    window.localStorage.setItem("brewcycle-cart", JSON.stringify(nextItems));
  }

  function remove(productId: string) {
    persist(items.filter((item) => item.product_id !== productId));
    window.dispatchEvent(new Event("brewcycle-cart-updated"));
  }

  function changeQty(productId: string, delta: number) {
    const nextItems = items
      .map((item) => (item.product_id === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
      .filter((item) => item.qty > 0);
    persist(nextItems);
    window.dispatchEvent(new Event("brewcycle-cart-updated"));
  }

  function checkout(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ product_id: item.product_id, qty: item.qty })),
          total_price: total,
          shipping_recipient: formData.get("shipping_recipient"),
          shipping_phone: formData.get("shipping_phone"),
          shipping_address: formData.get("shipping_address")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Checkout gagal");
        notify({ title: "Checkout gagal", description: data.message, type: "error" });
        return;
      }

      setOrderId(data.order_id);
      setMessage("Order dibuat. Upload bukti transfer untuk verifikasi admin.");
      notify({ title: "Order dibuat", description: "Upload bukti transfer untuk verifikasi admin.", type: "success", browser: true });
      persist([]);
      window.dispatchEvent(new Event("brewcycle-cart-updated"));
      router.refresh();
    });
  }

  function uploadProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    formData.set("order_id", orderId);

    startTransition(async () => {
      const response = await fetch("/api/order/upload-proof", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Upload bukti gagal");
        notify({ title: "Upload bukti gagal", description: data.message, type: "error" });
        return;
      }

      setMessage(`Status pembayaran: ${data.status}`);
      notify({ title: "Bukti pembayaran terkirim", description: `Status: ${data.status}`, type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">
              Keranjang kosong. Tambahkan produk BrewCycle dari halaman produk untuk mulai checkout.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.product_id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-eco-soft text-eco">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={160} height={160} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-slate-600">{formatRupiah(item.price)}</p>
                  <p className="mt-1 text-sm font-semibold text-coffee-dark">Subtotal {formatRupiah(Number(item.price) * item.qty)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => changeQty(item.product_id, -1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                  <Button variant="outline" size="icon" onClick={() => changeQty(item.product_id, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(item.product_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checkout Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-coffee-soft p-4">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-950">{formatRupiah(total)}</p>
          </div>
          <form
            id="checkout-form"
            className="space-y-3 rounded-xl border bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              checkout(new FormData(event.currentTarget));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="shipping_recipient">Nama Penerima</Label>
              <Input id="shipping_recipient" name="shipping_recipient" required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_phone">Nomor Penerima</Label>
              <Input id="shipping_phone" name="shipping_phone" type="tel" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_address">Alamat Pengiriman</Label>
              <Input id="shipping_address" name="shipping_address" required minLength={10} />
            </div>
          </form>
          <Button className="w-full" form="checkout-form" disabled={!items.length || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            {isPending ? "Memproses..." : "Buat Order"}
          </Button>
          {orderId ? (
            <form className="space-y-3 border-t pt-4" onSubmit={uploadProof}>
              <div className="space-y-2">
                <Label htmlFor="proof">Bukti Transfer</Label>
                <Input id="proof" name="proof" type="file" accept=".jpg,.jpeg,.png" required />
              </div>
              <Button className="w-full" variant="secondary" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isPending ? "Mengupload..." : "Upload Bukti"}
              </Button>
            </form>
          ) : null}
          {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
