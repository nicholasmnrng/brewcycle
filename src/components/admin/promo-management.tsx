"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/notifications/toast-provider";

type ProductOption = { id: string; name: string };
type PromoRow = {
  id: string;
  productId: string | null;
  title: string;
  description: string;
  discountType: string;
  discountValue: string;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";
};

export function PromoManagement({ promos, products }: { promos: PromoRow[]; products: ProductOption[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const data = await response.json();
      if (!response.ok) {
        notify({ title: "Promo gagal disimpan", description: data.message, type: "error" });
        return;
      }
      notify({ title: "Promo dibuat", type: "success", browser: true });
      form.reset();
      router.replace("/dashboard/promos");
      router.refresh();
    });
  }

  function disablePromo(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        notify({ title: "Promo gagal dinonaktifkan", description: data.message, type: "error" });
        return;
      }
      notify({ title: "Promo dinonaktifkan", type: "success", browser: true });
      router.replace("/dashboard/promos");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Promo</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select name="product_id" defaultValue="">
                <option value="">Semua produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input name="title" required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea name="description" required minLength={5} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipe Diskon</Label>
                <Select name="discount_type" defaultValue="PERCENT">
                  <option value="PERCENT">Percent</option>
                  <option value="NOMINAL">Nominal</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nilai</Label>
                <Input name="discount_value" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPIRED">Expired</option>
                <option value="DISABLED">Disabled</option>
              </Select>
            </div>
            <Button disabled={isPending}>
              <Sparkles className="h-4 w-4" />
              Simpan Promo
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((promo) => (
          <Card key={promo.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{promo.title}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">{promo.description}</p>
              </div>
              <Badge variant={promo.status === "DISABLED" ? "destructive" : "default"}>{promo.status}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-coffee-dark">
                {promo.discountType} {promo.discountValue}
              </p>
              <Button size="sm" variant="destructive" disabled={isPending || promo.status === "DISABLED"} onClick={() => disablePromo(promo.id)}>
                <Trash2 className="h-4 w-4" />
                Disable
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
