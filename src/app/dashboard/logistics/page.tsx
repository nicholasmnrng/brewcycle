import { desc, eq, inArray } from "drizzle-orm";
import { Truck } from "lucide-react";
import { AssignDriverForm } from "@/components/admin/assign-driver-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { pickupRequests, users } from "@/db/schema";

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

export default async function LogisticsPage() {
  const [pickups, drivers] = await Promise.all([
    db
      .select({
        id: pickupRequests.id,
        status: pickupRequests.status,
        scheduleDate: pickupRequests.scheduleDate,
        estimatedWeight: pickupRequests.estimatedWeight,
        pickupAddress: pickupRequests.pickupAddress,
        contactName: pickupRequests.contactName,
        contactPhone: pickupRequests.contactPhone,
        zone: pickupRequests.zone,
        driverId: pickupRequests.driverId,
        cafeName: users.name
      })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .where(inArray(pickupRequests.status, ["PENDING", "RESCHEDULED", "ASSIGNED", "FAILED"]))
      .orderBy(desc(pickupRequests.createdAt)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "DRIVER"))
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Logistik Control</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Assign driver secara manual ke pickup request dan pantau status yang butuh intervensi.
        </p>
      </div>

      <div className="grid gap-4">
        {pickups.map((pickup) => (
          <Card key={pickup.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{pickup.cafeName}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(pickup.scheduleDate)}{" "}
                  - estimasi {pickup.estimatedWeight} kg
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pickup.pickupAddress}</p>
                <p className="mt-1 text-xs text-slate-500">
                  PIC: {pickup.contactName ?? "-"} ({pickup.contactPhone ?? "-"}) - Zona: {pickup.zone ?? "-"}
                </p>
              </div>
              <Badge variant={statusVariant[pickup.status]}>{pickup.status}</Badge>
            </CardHeader>
            <CardContent>
              <AssignDriverForm pickupId={pickup.id} drivers={drivers} />
            </CardContent>
          </Card>
        ))}
        {!pickups.length ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-slate-600">
              <Truck className="h-5 w-5 text-primary" />
              Tidak ada pickup yang perlu di-assign.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
