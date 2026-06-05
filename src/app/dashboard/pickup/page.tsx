import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CalendarDays, Leaf, PackageCheck, Truck } from "lucide-react";
import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { CancelPickupButton } from "@/components/pickup/cancel-pickup-button";
import { PickupRequestModal } from "@/components/pickup/pickup-request-modal";
import { ReschedulePickupForm } from "@/components/pickup/reschedule-pickup-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { pickupRequests } from "@/db/schema";
import { canCafeReschedule } from "@/lib/pickup";

export const dynamic = "force-dynamic";

const statusVariant = {
  PENDING: "warning",
  ASSIGNED: "secondary",
  IN_TRANSIT: "default",
  WAITING_OTP: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
  RESCHEDULED: "secondary",
  FAILED: "destructive"
} as const;

const otpVisibleStatuses = new Set(["PENDING", "ASSIGNED", "IN_TRANSIT", "WAITING_OTP", "RESCHEDULED"]);

export default async function CafePickupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CAFE") {
    redirect("/dashboard");
  }

  const pickups = await db
    .select({
      id: pickupRequests.id,
      estimatedWeight: pickupRequests.estimatedWeight,
      actualWeight: pickupRequests.actualWeight,
      status: pickupRequests.status,
      scheduleDate: pickupRequests.scheduleDate,
      pickupAddress: pickupRequests.pickupAddress,
      pickupLatitude: pickupRequests.pickupLatitude,
      pickupLongitude: pickupRequests.pickupLongitude,
      contactName: pickupRequests.contactName,
      contactPhone: pickupRequests.contactPhone,
      zone: pickupRequests.zone,
      otpCode: pickupRequests.otpCode,
      rescheduleReason: pickupRequests.rescheduleReason,
      createdAt: pickupRequests.createdAt
    })
    .from(pickupRequests)
    .where(eq(pickupRequests.cafeId, session.user.id))
    .orderBy(desc(pickupRequests.createdAt))
    .limit(10);

  const [impact] = await db
    .select({
      wasteKg: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)`
    })
    .from(pickupRequests)
    .where(eq(pickupRequests.cafeId, session.user.id));

  const wasteKg = Number(impact?.wasteKg ?? 0);
  const latestPickup = pickups[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="secondary">Kafe</Badge>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Pickup Ampas Kopi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Jadwalkan pickup, pantau status terakhir, dan lakukan reschedule selama status masih
            PENDING atau ASSIGNED.
          </p>
        </div>
        <PickupRequestModal />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Status Terakhir</CardTitle>
            <Truck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">{latestPickup?.status ?? "Belum ada"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Dampak Terkumpul</CardTitle>
            <Leaf className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">{wasteKg.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Request Aktif</CardTitle>
            <PackageCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950">
              {pickups.filter((pickup) => pickup.status !== "COMPLETED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-950">Riwayat Pickup</h2>
        </div>

        {pickups.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Belum ada jadwal pickup"
            description="Buat jadwal pertama untuk mulai mengumpulkan limbah ampas kopi."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pickups.map((pickup) => (
              <Card key={pickup.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(pickup.scheduleDate)}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600">
                      Estimasi {pickup.estimatedWeight} kg
                      {pickup.actualWeight ? `, aktual ${pickup.actualWeight} kg` : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {pickup.pickupAddress ?? "Alamat belum tersedia"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PIC: {pickup.contactName ?? "-"} ({pickup.contactPhone ?? "-"}) - Zona: {pickup.zone ?? "-"}
                    </p>
                    {pickup.pickupLatitude && pickup.pickupLongitude ? (
                      <p className="mt-1 text-xs text-slate-500">
                        GPS: {pickup.pickupLatitude}, {pickup.pickupLongitude}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={statusVariant[pickup.status]}>{pickup.status}</Badge>
                </CardHeader>
                <CardContent>
                  {pickup.otpCode && otpVisibleStatuses.has(pickup.status) ? (
                    <div className="mb-3 rounded-xl border border-primary/20 bg-green-50 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">OTP Kafe</p>
                      <p className="mt-1 text-2xl font-bold tracking-widest text-slate-950">{pickup.otpCode}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Berikan kode ini ke driver saat pickup akan diselesaikan.
                      </p>
                    </div>
                  ) : null}
                  {pickup.rescheduleReason ? (
                    <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-secondary">
                      Alasan reschedule: {pickup.rescheduleReason}
                    </p>
                  ) : null}
                  {canCafeReschedule(pickup.status) ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <ReschedulePickupForm pickupId={pickup.id} />
                      <CancelPickupButton pickupId={pickup.id} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Reschedule tidak tersedia untuk status ini.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
