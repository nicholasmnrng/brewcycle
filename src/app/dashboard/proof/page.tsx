import { desc, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ImageIcon, ReceiptText, Truck } from "lucide-react";
import { auth } from "@/auth";
import { ProofMonitor } from "@/components/admin/proof-monitor";
import { BentoCard, DashboardHero, StatCard } from "@/components/dashboard/primitives";
import { db } from "@/db";
import { orders, pickupRequests, users } from "@/db/schema";
import { dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function ProofPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const [pickupProofs, paymentProofs] = await Promise.all([
    db
      .select({
        id: pickupRequests.id,
        title: users.name,
        status: pickupRequests.status,
        imageUrl: pickupRequests.proofPhotoUrl,
        createdAt: pickupRequests.createdAt
      })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .where(isNotNull(pickupRequests.proofPhotoUrl))
      .orderBy(desc(pickupRequests.createdAt))
      .limit(24),
    db
      .select({
        id: orders.id,
        title: users.name,
        status: orders.paymentStatus,
        imageUrl: orders.paymentProofUrl,
        createdAt: orders.createdAt
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(isNotNull(orders.paymentProofUrl))
      .orderBy(desc(orders.createdAt))
      .limit(24)
  ]);

  const proofItems = [
    ...pickupProofs.map((item) => ({ ...item, kind: "pickup" as const, createdAt: item.createdAt.toISOString() })),
    ...paymentProofs.map((item) => ({ ...item, kind: "payment" as const, createdAt: item.createdAt.toISOString() }))
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Proof Monitoring"
        description="Pantau bukti pickup dari Driver dan bukti pembayaran Buyer secara real-time dengan polling ringan."
        icon={ImageIcon}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Bukti" value={proofItems.length} icon={ImageIcon} />
        <StatCard label="Bukti Pickup" value={pickupProofs.length} icon={Truck} tone="coffee" />
        <StatCard label="Bukti Pembayaran" value={paymentProofs.length} icon={ReceiptText} tone="amber" />
      </div>

      <BentoCard title="Proof Feed" description="Auto-refresh setiap 10 detik dari bukti terbaru yang masuk.">
        <ProofMonitor initialItems={proofItems} limit={24} />
      </BentoCard>
    </div>
  );
}
