"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProofItem = {
  id: string;
  kind: "pickup" | "payment";
  title: string;
  status: string;
  imageUrl: string | null;
  createdAt: string;
};

export function ProofMonitor({ initialItems, limit = 6 }: { initialItems: ProofItem[]; limit?: number }) {
  const [items, setItems] = useState(initialItems);
  const [preview, setPreview] = useState<ProofItem | null>(null);
  const visibleItems = items.slice(0, limit);

  async function load() {
    const response = await fetch("/api/admin/proof-feed", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="space-y-3">
        {items.length ? (
          visibleItems.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-eco-soft text-eco">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.title} width={96} height={96} unoptimized className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="text-xs text-slate-500">{item.kind === "pickup" ? "Bukti pickup driver" : "Bukti pembayaran buyer"}</p>
              </div>
              <Badge variant="outline">{item.status}</Badge>
              <Button size="icon" variant="ghost" onClick={() => setPreview(item)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">
            Belum ada gambar masuk dari Driver atau Buyer.
          </div>
        )}
      </div>
      {preview?.imageUrl ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-coffee-dark/60 p-4 backdrop-blur" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-premium" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-950">{preview.title}</p>
                <p className="text-sm text-slate-500">{preview.kind === "pickup" ? "Bukti pickup" : "Bukti pembayaran"}</p>
              </div>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Tutup
              </Button>
            </div>
            <Image
              src={preview.imageUrl}
              alt={preview.title}
              width={1200}
              height={800}
              unoptimized
              className="max-h-[72vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
