"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PackagePlus, Pencil, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/notifications/toast-provider";

type ProductRow = {
  id: string;
  category: string;
  name: string;
  description: string;
  usageGuide: string | null;
  imageUrl: string | null;
  price: string;
  stock: number;
  unit: string;
};

export function ProductManagement({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitProduct(event: React.FormEvent<HTMLFormElement>, productId?: string) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PATCH" : "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Produk gagal disimpan");
        notify({ title: "Produk gagal disimpan", description: data.message, type: "error" });
        return;
      }

      setMessage(productId ? "Produk diperbarui" : "Produk dibuat");
      notify({ title: productId ? "Produk diperbarui" : "Produk dibuat", type: "success", browser: true });
      setEditingId(null);
      router.refresh();
    });
  }

  function deleteProduct(productId: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Produk gagal dihapus");
        notify({ title: "Produk gagal dihapus", description: data.message, type: "error" });
        return;
      }

      setMessage("Produk dihapus");
      notify({ title: "Produk dihapus", type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm disabled={isPending} onSubmit={(event) => submitProduct(event)} />
          {message ? <p className="mt-3 text-sm font-medium text-slate-600">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={900}
                height={360}
                unoptimized
                className="aspect-[5/2] w-full rounded-t-xl object-cover"
              />
            ) : null}
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{product.description}</p>
              </div>
              <Badge variant="outline">Stok {product.stock}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold text-slate-950">{formatRupiah(product.price)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(product.id)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
              {editingId === product.id ? (
                <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                  <ProductForm
                    product={product}
                    disabled={isPending}
                    onSubmit={(event) => submitProduct(event, product.id)}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  disabled,
  onSubmit
}: {
  product?: ProductRow;
  disabled: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nama</Label>
          <Input name="name" defaultValue={product?.name} required />
        </div>
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Input name="category" defaultValue={product?.category} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea name="description" defaultValue={product?.description} required />
      </div>
      <div className="space-y-2">
        <Label>Panduan Pakai</Label>
        <Textarea name="usage_guide" defaultValue={product?.usageGuide ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Harga</Label>
          <Input name="price" type="number" min="1" defaultValue={product?.price} required />
        </div>
        <div className="space-y-2">
          <Label>Stok</Label>
          <Input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Input name="unit" defaultValue={product?.unit ?? "pack"} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Foto Produk</Label>
        <Input name="image" type="file" accept=".jpg,.jpeg,.png" />
      </div>
      <Button disabled={disabled}>
        <PackagePlus className="h-4 w-4" />
        Simpan Produk
      </Button>
    </form>
  );
}
