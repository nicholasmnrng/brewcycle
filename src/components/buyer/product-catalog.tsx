"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Package } from "lucide-react";

export function ProductCatalog({ products }: { products: ProductCardData[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sort, setSort] = useState("newest");
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filtered = useMemo(() => {
    const next = products
      .filter((product) => category === "Semua" || product.category === category)
      .filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()));

    return next.sort((a, b) => {
      if (sort === "price-low") return Number(a.price) - Number(b.price);
      if (sort === "price-high") return Number(b.price) - Number(a.price);
      if (sort === "stock") return b.stock - a.stock;
      return 0;
    });
  }, [products, category, query, sort]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[1.35rem] border bg-white p-4 shadow-soft lg:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk..." />
        </div>
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Terbaru</option>
          <option value="price-low">Harga termurah</option>
          <option value="price-high">Harga tertinggi</option>
          <option value="stock">Stok terbanyak</option>
        </Select>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} action={<AddToCartButton product={product} compact />} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Package} title="Produk tidak ditemukan" description="Coba ubah kata kunci atau filter kategori." />
      )}
    </div>
  );
}
