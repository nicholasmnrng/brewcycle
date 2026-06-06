import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DriverPickupActions } from "@/components/driver/driver-pickup-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { pickupRequests, users } from "@/db/schema";
import { pickupPriority } from "@/lib/pickup";
import { dashboardHomeForRole } from "@/lib/role-routing";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DRIVER") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const tasks = await db
    .select({
      id: pickupRequests.id,
      status: pickupRequests.status,
      scheduleDate: pickupRequests.scheduleDate,
      estimatedWeight: pickupRequests.estimatedWeight,
      pickupAddress: pickupRequests.pickupAddress,
      contactName: pickupRequests.contactName,
      contactPhone: pickupRequests.contactPhone,
      cafeName: users.name
    })
    .from(pickupRequests)
    .innerJoin(users, eq(pickupRequests.cafeId, users.id))
    .where(
      and(
        eq(pickupRequests.driverId, session.user.id),
        inArray(pickupRequests.status, ["ASSIGNED", "IN_TRANSIT", "WAITING_OTP", "FAILED"])
      )
    )
    .orderBy(desc(pickupRequests.scheduleDate));

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Driver</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Taskboard Harian</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Alur pickup: check-in GPS, input berat, upload foto, input OTP, lalu submit.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{task.cafeName}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(task.scheduleDate)}{" "}
                  - {task.estimatedWeight} kg
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{task.pickupAddress}</p>
                <p className="mt-1 text-xs text-slate-500">
                  PIC: {task.contactName ?? "-"} ({task.contactPhone ?? "-"})
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge>{pickupPriority(task.scheduleDate)}</Badge>
                <Badge variant={task.status === "FAILED" ? "destructive" : "secondary"}>{task.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DriverPickupActions pickupId={task.id} status={task.status} />
            </CardContent>
          </Card>
        ))}
        {!tasks.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">Belum ada tugas driver.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
