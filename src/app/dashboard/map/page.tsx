import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LeafletMapPanel } from "@/components/driver/leaflet-map-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { pickupRequests, users } from "@/db/schema";
import { getPickupCenter } from "@/lib/pickup";
import { dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DRIVER") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const center = getPickupCenter();
  const taskRows = await db
    .select({
      id: pickupRequests.id,
      status: pickupRequests.status,
      pickupAddress: pickupRequests.pickupAddress,
      pickupLatitude: pickupRequests.pickupLatitude,
      pickupLongitude: pickupRequests.pickupLongitude,
      cafeName: users.name
    })
    .from(pickupRequests)
    .innerJoin(users, eq(pickupRequests.cafeId, users.id))
    .where(
      and(
        eq(pickupRequests.driverId, session.user.id),
        inArray(pickupRequests.status, ["ASSIGNED", "IN_TRANSIT", "WAITING_OTP"])
      )
    );
  const pickups = taskRows
    .filter((task) => task.pickupLatitude && task.pickupLongitude)
    .map((task) => ({
      id: task.id,
      cafeName: task.cafeName,
      address: task.pickupAddress,
      lat: Number(task.pickupLatitude),
      lng: Number(task.pickupLongitude),
      status: task.status
    }));

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="order-2 lg:order-1">
        <CardHeader>
          <Badge variant="secondary">Driver</Badge>
          <CardTitle className="mt-2">Navigasi Pickup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>Mode mobile menampilkan peta sebagai area utama. Desktop memakai side-panel + map.</p>
          <p>{pickups.length} titik pickup aktif siap dinavigasi.</p>
        </CardContent>
      </Card>
      <div className="order-1 lg:order-2">
        <LeafletMapPanel center={pickups[0] ?? center} pickups={pickups} />
      </div>
    </div>
  );
}
