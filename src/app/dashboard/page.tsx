import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import {
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Gift,
  Leaf,
  Map,
  Package,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Users
} from "lucide-react";
import { auth } from "@/auth";
import { ProofMonitor } from "@/components/admin/proof-monitor";
import {
  ActivityTimeline,
  BentoCard,
  DashboardHero,
  PickupStatusTimeline,
  QuickActionCard,
  RoleDashboardLayout,
  StatCard
} from "@/components/dashboard/primitives";
import { InteractiveChartCard } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/empty-state";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { orders, pickupRequests, products, promos, users } from "@/db/schema";
import { formatRupiah } from "@/lib/orders";
import { bestPromoForProduct } from "@/lib/promos";

export const dynamic = "force-dynamic";

const activePickupStatuses = ["PENDING", "ASSIGNED", "IN_TRANSIT", "WAITING_OTP", "RESCHEDULED"] as const;

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role ?? "BUYER";

  if (role === "ADMIN") return <AdminDashboard name={session?.user.name ?? "Admin BrewCycle"} />;
  if (role === "CAFE") return <CafeDashboard userId={session?.user.id ?? ""} name={session?.user.name ?? "Kafe"} points={session?.user.totalPoints ?? 0} />;
  if (role === "DRIVER") return <DriverDashboard userId={session?.user.id ?? ""} name={session?.user.name ?? "Driver"} />;
  return <BuyerDashboard />;
}

async function AdminDashboard({ name }: { name: string }) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    pickupPending,
    pickupActive,
    driverOnline,
    wasteMonth,
    paymentPending,
    cafeActive,
    orderNew,
    promoActive,
    assignmentRows,
    driverRows,
    pickupChart,
    wasteChart,
    orderChart,
    recentPickups,
    recentOrders,
    pickupProofs,
    paymentProofs
  ] = await Promise.all([
    countPickups(["PENDING", "RESCHEDULED"]),
    countPickups([...activePickupStatuses]),
    countUsers({ role: "DRIVER", online: true }),
    db
      .select({ value: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)` })
      .from(pickupRequests)
      .where(and(eq(pickupRequests.status, "COMPLETED"), gte(pickupRequests.scheduleDate, monthStart))),
    db.select({ value: sql<string>`count(*)` }).from(orders).where(eq(orders.paymentStatus, "PENDING")),
    countUsers({ role: "CAFE", active: true }),
    db.select({ value: sql<string>`count(*)` }).from(orders).where(eq(orders.status, "PENDING")),
    db.select({ value: sql<string>`count(*)` }).from(promos).where(eq(promos.status, "ACTIVE")),
    db
      .select({
        id: pickupRequests.id,
        cafeName: users.name,
        scheduleDate: pickupRequests.scheduleDate,
        estimatedWeight: pickupRequests.estimatedWeight,
        status: pickupRequests.status,
        zone: pickupRequests.zone
      })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .where(eq(pickupRequests.status, "PENDING"))
      .orderBy(desc(pickupRequests.createdAt))
      .limit(5),
    db
      .select({
        driverName: users.name,
        totalTask: sql<string>`count(${pickupRequests.id})`,
        completed: sql<string>`sum(case when ${pickupRequests.status} = 'COMPLETED' then 1 else 0 end)`,
        failed: sql<string>`sum(case when ${pickupRequests.status} = 'FAILED' then 1 else 0 end)`
      })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.driverId, users.id))
      .groupBy(users.id)
      .limit(5),
    db
      .select({
        label: sql<string>`to_char(date_trunc('day', ${pickupRequests.scheduleDate}), 'DD Mon')`,
        value: sql<string>`count(*)`
      })
      .from(pickupRequests)
      .groupBy(sql`date_trunc('day', ${pickupRequests.scheduleDate})`)
      .orderBy(sql`date_trunc('day', ${pickupRequests.scheduleDate})`)
      .limit(14),
    db
      .select({
        label: sql<string>`to_char(date_trunc('month', ${pickupRequests.scheduleDate}), 'Mon')`,
        value: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)`
      })
      .from(pickupRequests)
      .where(eq(pickupRequests.status, "COMPLETED"))
      .groupBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
      .orderBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
      .limit(12),
    db
      .select({
        label: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'DD Mon')`,
        value: sql<string>`count(*)`
      })
      .from(orders)
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`)
      .limit(14),
    db
      .select({ id: pickupRequests.id, status: pickupRequests.status, cafeName: users.name, createdAt: pickupRequests.createdAt })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .orderBy(desc(pickupRequests.createdAt))
      .limit(4),
    db
      .select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus, buyerName: users.name, createdAt: orders.createdAt })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(4),
    db
      .select({ id: pickupRequests.id, title: users.name, status: pickupRequests.status, imageUrl: pickupRequests.proofPhotoUrl, createdAt: pickupRequests.createdAt })
      .from(pickupRequests)
      .innerJoin(users, eq(pickupRequests.cafeId, users.id))
      .where(isNotNull(pickupRequests.proofPhotoUrl))
      .orderBy(desc(pickupRequests.createdAt))
      .limit(4),
    db
      .select({ id: orders.id, title: users.name, status: orders.paymentStatus, imageUrl: orders.paymentProofUrl, createdAt: orders.createdAt })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(isNotNull(orders.paymentProofUrl))
      .orderBy(desc(orders.createdAt))
      .limit(4)
  ]);

  const proofItems = [
    ...pickupProofs.map((item) => ({ ...item, kind: "pickup" as const, createdAt: item.createdAt.toISOString() })),
    ...paymentProofs.map((item) => ({ ...item, kind: "payment" as const, createdAt: item.createdAt.toISOString() }))
  ];

  return (
    <RoleDashboardLayout>
      <DashboardHero
        badge="Admin"
        title={`Selamat datang, ${name}`}
        description="Pantau logistik, transaksi, pembayaran, performa driver, promo, dan audit operasional BrewCycle dari satu command center."
        cta={{ href: "/dashboard/logistics", label: "Kelola Logistik" }}
        icon={Truck}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pickup Pending" value={Number(pickupPending[0]?.value ?? 0)} icon={CalendarClock} tone="amber" />
        <StatCard label="Pickup Aktif" value={Number(pickupActive[0]?.value ?? 0)} icon={Truck} />
        <StatCard label="Driver Online" value={Number(driverOnline[0]?.value ?? 0)} icon={Map} />
        <StatCard label="Limbah Bulan Ini" value={`${Number(wasteMonth[0]?.value ?? 0).toFixed(1)} kg`} icon={Leaf} />
        <StatCard label="Pembayaran Pending" value={Number(paymentPending[0]?.value ?? 0)} icon={CircleDollarSign} tone="amber" />
        <StatCard label="Cafe Aktif" value={Number(cafeActive[0]?.value ?? 0)} icon={Users} tone="coffee" />
        <StatCard label="Order Baru" value={Number(orderNew[0]?.value ?? 0)} icon={ShoppingCart} />
        <StatCard label="Promo Aktif" value={Number(promoActive[0]?.value ?? 0)} icon={Sparkles} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <BentoCard title="Assignment Board" description="Pickup yang belum memiliki driver.">
          {assignmentRows.length ? (
            <div className="space-y-3">
              {assignmentRows.map((pickup) => (
                <div key={pickup.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{pickup.cafeName}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(pickup.scheduleDate)} - {pickup.estimatedWeight} kg - {pickup.zone ?? "Tanpa zona"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{pickup.status}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <a href="/dashboard/logistics">Assign</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Truck} title="Semua pickup sudah ter-assign" description="Tidak ada antrian pickup pending saat ini." actionLabel="Buka Logistik" actionHref="/dashboard/logistics" />
          )}
        </BentoCard>
        <BentoCard title="Proof Monitoring" description="Auto-refresh setiap 10 detik untuk bukti driver dan buyer.">
          <ProofMonitor initialItems={proofItems} />
        </BentoCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <InteractiveChartCard title="Pickup Harian" description="Jumlah request pickup per hari." data={normalizeChart(pickupChart)} dataKey="value" />
        <InteractiveChartCard title="Limbah Terkumpul" description="Tren kg limbah selesai diproses." data={normalizeChart(wasteChart)} dataKey="value" type="bar" />
        <InteractiveChartCard title="Order Harian" description="Aktivitas transaksi marketplace." data={normalizeChart(orderChart)} dataKey="value" type="line" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BentoCard title="Driver Performance" description="Ringkasan task driver berdasarkan assignment.">
          <div className="space-y-3">
            {driverRows.length ? driverRows.map((driver) => (
              <div key={driver.driverName} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">{driver.driverName}</p>
                  <Badge>{Number(driver.completed ?? 0)} selesai</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Total task {Number(driver.totalTask ?? 0)} - gagal {Number(driver.failed ?? 0)}
                </p>
              </div>
            )) : <p className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">Belum ada performa driver.</p>}
          </div>
        </BentoCard>
        <BentoCard title="Recent Activity" description="Aktivitas operasional terbaru.">
          <ActivityTimeline
            items={[
              ...recentPickups.map((item) => ({
                title: `${item.cafeName} menjadwalkan pickup`,
                description: `Status ${item.status}`,
                time: formatDate(item.createdAt),
                status: item.status
              })),
              ...recentOrders.map((item) => ({
                title: `${item.buyerName} membuat order`,
                description: `Order ${item.status}, pembayaran ${item.paymentStatus}`,
                time: formatDate(item.createdAt),
                status: item.paymentStatus
              }))
            ].slice(0, 6)}
          />
        </BentoCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard href="/dashboard/master-data" title="Master Data" description="Kelola akun aktif dan nonaktif." icon={Users} />
        <QuickActionCard href="/dashboard/audit-log" title="Audit Log" description="Lihat aktivitas penting sistem." icon={BadgeCheck} />
        <QuickActionCard href="/dashboard/promos" title="Promo" description="Kelola promo untuk Buyer." icon={Sparkles} />
        <QuickActionCard href="/dashboard/gamification" title="Reward" description="Atur poin dan katalog reward." icon={Gift} />
      </div>
    </RoleDashboardLayout>
  );
}

async function CafeDashboard({ userId, name, points }: { userId: string; name: string; points: number }) {
  const [pickups, impact, monthly] = await Promise.all([
    db.select().from(pickupRequests).where(eq(pickupRequests.cafeId, userId)).orderBy(desc(pickupRequests.createdAt)).limit(8),
    db.select({ wasteKg: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)` }).from(pickupRequests).where(and(eq(pickupRequests.cafeId, userId), eq(pickupRequests.status, "COMPLETED"))),
    db
      .select({
        label: sql<string>`to_char(date_trunc('month', ${pickupRequests.scheduleDate}), 'Mon')`,
        value: sql<string>`coalesce(sum(${pickupRequests.actualWeight}), 0)`
      })
      .from(pickupRequests)
      .where(and(eq(pickupRequests.cafeId, userId), eq(pickupRequests.status, "COMPLETED")))
      .groupBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
      .orderBy(sql`date_trunc('month', ${pickupRequests.scheduleDate})`)
  ]);
  const nextPickup = pickups.find((pickup) => activePickupStatuses.includes(pickup.status as typeof activePickupStatuses[number]));
  const wasteKg = Number(impact[0]?.wasteKg ?? 0);

  return (
    <RoleDashboardLayout>
      <DashboardHero
        badge="Cafe"
        title={`Selamat datang, ${name}`}
        description="Pantau pickup berikutnya, dampak lingkungan, reward, dan riwayat aktivitas ampas kopi kamu."
        cta={{ href: "/dashboard/pickup", label: "Jadwalkan Pickup" }}
        icon={Leaf}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Pickup" value={pickups.length} icon={Truck} />
        <StatCard label="Limbah Terkumpul" value={`${wasteKg.toFixed(1)} kg`} icon={Leaf} />
        <StatCard label="Poin Tersedia" value={points} icon={Gift} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BentoCard title="Next Pickup" description="Status pickup terdekat kamu.">
          {nextPickup ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-eco-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{formatDate(nextPickup.scheduleDate)}</p>
                    <p className="mt-1 text-sm text-slate-500">{nextPickup.pickupAddress ?? "Alamat belum tersedia"}</p>
                  </div>
                  <Badge>{nextPickup.status}</Badge>
                </div>
              </div>
              <PickupStatusTimeline status={nextPickup.status} />
              <div className="flex gap-2">
                <Button asChild variant="outline"><a href="/dashboard/pickup">Lihat Detail</a></Button>
                <Button asChild><a href="/dashboard/pickup">Jadwal Ulang</a></Button>
              </div>
            </div>
          ) : (
            <EmptyState icon={Truck} title="Belum ada pickup aktif" description="Belum ada pickup hari ini. Jadwalkan pickup pertama kamu." actionLabel="Jadwalkan Pickup" actionHref="/dashboard/pickup" />
          )}
        </BentoCard>
        <InteractiveChartCard title="Activity & Impact Chart" description="Ringkasan limbah yang sudah completed." data={normalizeChart(monthly)} dataKey="value" type="area" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <BentoCard title="Reward Progress" description="Progress menuju reward berikutnya.">
          <div className="rounded-2xl bg-coffee-soft p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-950">{points} poin</p>
              <Badge variant="secondary">Target 100</Badge>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-eco" style={{ width: `${Math.min(100, points)}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-500">{points >= 100 ? "Ada reward yang bisa diklaim." : `${100 - points} poin lagi untuk reward pertama.`}</p>
          </div>
        </BentoCard>
        <BentoCard title="Pickup History" description="Riwayat pickup terbaru.">
          <ActivityTimeline
            items={pickups.map((pickup) => ({
              title: `${pickup.status} - ${pickup.actualWeight ?? pickup.estimatedWeight} kg`,
              description: pickup.pickupAddress ?? "Alamat belum tersedia",
              time: formatDate(pickup.scheduleDate),
              status: pickup.status
            }))}
          />
        </BentoCard>
      </div>
    </RoleDashboardLayout>
  );
}

async function DriverDashboard({ userId, name }: { userId: string; name: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tasks = await db
    .select({
      id: pickupRequests.id,
      status: pickupRequests.status,
      scheduleDate: pickupRequests.scheduleDate,
      estimatedWeight: pickupRequests.estimatedWeight,
      pickupAddress: pickupRequests.pickupAddress,
      cafeName: users.name
    })
    .from(pickupRequests)
    .innerJoin(users, eq(pickupRequests.cafeId, users.id))
    .where(and(eq(pickupRequests.driverId, userId), inArray(pickupRequests.status, ["ASSIGNED", "IN_TRANSIT", "WAITING_OTP", "FAILED", "COMPLETED"])))
    .orderBy(desc(pickupRequests.scheduleDate))
    .limit(8);

  const activeTasks = tasks.filter((task) => task.status !== "COMPLETED");

  return (
    <RoleDashboardLayout>
      <DashboardHero
        badge="Driver"
        title={`Selamat datang, ${name}`}
        description="Fokus pada task hari ini, rute pickup, status pekerjaan, dan konfirmasi bukti pickup."
        cta={{ href: "/dashboard/tasks", label: activeTasks.length ? "Mulai Task" : "Lihat Task" }}
        icon={Truck}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Task Hari Ini" value={tasks.filter((task) => task.scheduleDate >= today).length} icon={CalendarClock} />
        <StatCard label="Task Pending" value={tasks.filter((task) => task.status === "ASSIGNED").length} icon={Truck} tone="amber" />
        <StatCard label="On Route" value={tasks.filter((task) => task.status === "IN_TRANSIT" || task.status === "WAITING_OTP").length} icon={Map} />
        <StatCard label="Completed" value={tasks.filter((task) => task.status === "COMPLETED").length} icon={PackageCheck} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <BentoCard title="Task Queue" description="Task yang diberikan admin. Badge task baru muncul saat assignment masuk.">
          {activeTasks.length ? (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{task.cafeName}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(task.scheduleDate)} - {task.estimatedWeight} kg</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{task.pickupAddress}</p>
                    </div>
                    <Badge>{task.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm"><a href="/dashboard/tasks">Konfirmasi Pickup</a></Button>
                    <Button asChild size="sm" variant="outline"><a href="/dashboard/map">Lihat Rute</a></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Truck} title="Belum ada task aktif" description="Saat admin menugaskan pickup baru, badge notifikasi akan muncul otomatis." actionLabel="Buka Taskboard" actionHref="/dashboard/tasks" />
          )}
        </BentoCard>
        <BentoCard title="Route / Map Preview" description="Preview rute pickup aktif.">
          <div className="flex min-h-72 items-center justify-center rounded-[1.35rem] border bg-[linear-gradient(135deg,#E8F5EE,#F7F3EC)] p-6 text-center">
            <div>
              <Map className="mx-auto h-10 w-10 text-eco" />
              <p className="mt-3 font-semibold text-slate-950">Map preview siap</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Buka halaman Map untuk panel Leaflet dan navigasi pickup.</p>
              <Button asChild className="mt-4" variant="outline"><a href="/dashboard/map">Buka Map</a></Button>
            </div>
          </div>
        </BentoCard>
      </div>
      <BentoCard title="History Task" description="Riwayat task selesai dan gagal.">
        <ActivityTimeline items={tasks.map((task) => ({ title: `${task.cafeName} - ${task.status}`, description: task.pickupAddress ?? "", time: formatDate(task.scheduleDate), status: task.status }))} />
      </BentoCard>
    </RoleDashboardLayout>
  );
}

async function BuyerDashboard() {
  const [productRows, promoRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(promos).where(eq(promos.status, "ACTIVE")).orderBy(desc(promos.createdAt))
  ]);
  const productsWithPromos = productRows.map((product) => ({
    ...product,
    activePromo: bestPromoForProduct(product.id, Number(product.price), promoRows)
  }));

  return (
    <RoleDashboardLayout>
      <DashboardHero
        badge="Buyer"
        title="Produk BrewCycle"
        description="Jelajahi produk turunan ampas kopi, promo aktif, cart, checkout manual, dan riwayat order."
        cta={{ href: "/dashboard/cart", label: "Lihat Cart" }}
        icon={Package}
      />
      {promoRows.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {promoRows.slice(0, 3).map((promo) => (
            <Card key={promo.id} className="bg-coffee-dark text-white">
              <CardContent className="p-5">
                <Badge className="bg-white/15 text-white">Promo {promo.status}</Badge>
                <p className="mt-4 text-lg font-bold">{promo.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{promo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <BentoCard title="Promo Section" description="Promo aktif dari Admin akan muncul di sini.">
          <p className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">Belum ada promo aktif saat ini.</p>
        </BentoCard>
      )}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary">Marketplace</Badge>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Produk yang ditawarkan</h2>
            <p className="mt-1 text-sm text-slate-500">Filter kategori tersedia di halaman Produk.</p>
          </div>
          <Button asChild variant="outline"><a href="/dashboard/products">Lihat Semua Produk</a></Button>
        </div>
        {productRows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productsWithPromos.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                action={<AddToCartButton product={product} compact />}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title="Belum ada produk" description="Produk BrewCycle akan muncul setelah Admin menambahkannya." actionLabel="Refresh Produk" actionHref="/dashboard/products" />
        )}
      </div>
    </RoleDashboardLayout>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function normalizeChart(rows: Array<{ label: string; value: string | number }>) {
  return rows.map((row) => ({ label: row.label, value: Number(row.value) }));
}

function countPickups(statuses: readonly string[]) {
  return db.select({ value: sql<string>`count(*)` }).from(pickupRequests).where(inArray(pickupRequests.status, statuses as any));
}

function countUsers({ role, online, active }: { role: "ADMIN" | "CAFE" | "DRIVER" | "BUYER"; online?: boolean; active?: boolean }) {
  const filters = [eq(users.role, role)];
  if (typeof online === "boolean") filters.push(eq(users.driverOnline, online));
  if (typeof active === "boolean") filters.push(eq(users.isActive, active));
  return db.select({ value: sql<string>`count(*)` }).from(users).where(and(...filters));
}
