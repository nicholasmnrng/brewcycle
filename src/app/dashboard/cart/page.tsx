import { CartClient } from "@/components/buyer/cart-client";
import { Badge } from "@/components/ui/badge";

export default function CartPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Buyer</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Keranjang</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Checkout masih manual via transfer dan upload bukti pembayaran.
        </p>
      </div>
      <CartClient />
    </div>
  );
}
