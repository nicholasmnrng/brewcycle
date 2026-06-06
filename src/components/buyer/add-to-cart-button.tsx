"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/notifications/toast-provider";
import type { AppliedPromo } from "@/lib/promos";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: string;
    stock: number;
    imageUrl?: string | null;
    category?: string;
    description?: string;
    activePromo?: AppliedPromo | null;
  };
  compact?: boolean;
};

export function AddToCartButton({ product, compact }: AddToCartButtonProps) {
  const [message, setMessage] = useState("");
  const { notify } = useToast();

  function addToCart() {
    const cart = JSON.parse(window.localStorage.getItem("brewcycle-cart") ?? "[]") as Array<{
      product_id: string;
      name: string;
      price: string;
      originalPrice?: string;
      qty: number;
      imageUrl?: string | null;
      promoId?: string | null;
      promoTitle?: string | null;
      promoDiscountLabel?: string | null;
    }>;
    const existing = cart.find((item) => item.product_id === product.id);
    const unitPrice = product.activePromo?.finalPrice ?? Number(product.price);

    if (existing) {
      existing.qty += 1;
      existing.price = unitPrice.toFixed(2);
      existing.originalPrice = product.activePromo ? product.activePromo.originalPrice.toFixed(2) : undefined;
      existing.promoId = product.activePromo?.id ?? null;
      existing.promoTitle = product.activePromo?.title ?? null;
      existing.promoDiscountLabel = product.activePromo?.discountLabel ?? null;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: unitPrice.toFixed(2),
        originalPrice: product.activePromo ? product.activePromo.originalPrice.toFixed(2) : undefined,
        qty: 1,
        imageUrl: product.imageUrl ?? null,
        promoId: product.activePromo?.id ?? null,
        promoTitle: product.activePromo?.title ?? null,
        promoDiscountLabel: product.activePromo?.discountLabel ?? null
      });
    }

    window.localStorage.setItem("brewcycle-cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("brewcycle-cart-updated"));
    setMessage("Produk berhasil ditambahkan ke keranjang.");
    notify({
      title: "Produk berhasil ditambahkan ke keranjang.",
      description: product.name,
      type: "success",
      actionLabel: "OK"
    });
  }

  return (
    <div className="space-y-2">
      <Button className={compact ? "" : "w-full"} size={compact ? "sm" : "default"} onClick={addToCart} disabled={product.stock <= 0}>
        <ShoppingCart className="h-4 w-4" />
        {product.stock > 0 ? (compact ? "Tambah" : "Tambah ke Keranjang") : "Stok habis"}
      </Button>
      {!compact && message ? <p className="text-sm text-primary">{message}</p> : null}
    </div>
  );
}
