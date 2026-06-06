import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CartClient } from "@/components/buyer/cart-client";
import { Badge } from "@/components/ui/badge";
import { dashboardHomeForRole } from "@/lib/role-routing";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUYER") {
    redirect(dashboardHomeForRole(session.user.role));
  }

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
