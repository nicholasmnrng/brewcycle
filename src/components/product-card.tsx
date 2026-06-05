import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/orders";

export type ProductCardData = {
  id: string;
  category: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: string;
  stock: number;
};

export function ProductCard({
  product,
  action
}: {
  product: ProductCardData;
  action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={720}
          height={540}
          unoptimized
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-eco-soft text-eco">
          <Package className="h-10 w-10" />
        </div>
      )}
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="outline">{product.category}</Badge>
            <Link href={`/dashboard/products/${product.id}`} className="mt-3 block font-bold text-slate-950 hover:text-primary">
              {product.name}
            </Link>
          </div>
          <Badge variant={product.stock > 0 ? "default" : "destructive"}>Stok {product.stock}</Badge>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product.description}</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-coffee-dark">{formatRupiah(product.price)}</p>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
