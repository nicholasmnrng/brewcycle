import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileClient } from "@/components/profile/profile-client";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { orders, pickupRequests, rewards, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  if (!user) {
    redirect("/login");
  }

  const activitySource =
    user.role === "BUYER"
      ? orders.buyerId
      : user.role === "CAFE"
        ? pickupRequests.cafeId
        : user.role === "DRIVER"
          ? pickupRequests.driverId
          : rewards.userId;

  const activityTable = user.role === "BUYER" ? orders : user.role === "ADMIN" ? rewards : pickupRequests;
  const [activity] = await db
    .select({ count: sql<number>`count(1)::int` })
    .from(activityTable)
    .where(eq(activitySource, user.id));

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Akun</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Profil {user.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Kelola informasi akun, data pribadi, notifikasi, privasi, status, dan aktivitas.
        </p>
      </div>
      <ProfileClient
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          birthDate: user.birthDate,
          gender: user.gender,
          notificationsEnabled: user.notificationsEnabled,
          privacyMode: user.privacyMode,
          driverOnline: user.driverOnline,
          createdAt: user.createdAt
        }}
        activityCount={activity?.count ?? 0}
      />
    </div>
  );
}
