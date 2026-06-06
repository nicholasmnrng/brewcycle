import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditLogTable } from "@/components/audit-log-table";
import { DashboardHero, StatCard } from "@/components/dashboard/primitives";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { dashboardHomeForRole } from "@/lib/role-routing";
import { ScrollText, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Admin"
        title="Audit Log"
        description="Catatan aktivitas penting sistem: order, pickup, promo, reward, produk, dan master data."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total Log Ditampilkan" value={rows.length} icon={ScrollText} />
        <StatCard label="Modul Tercatat" value={new Set(rows.map((row) => row.module)).size} icon={ShieldCheck} tone="coffee" />
      </div>
      <AuditLogTable rows={rows} />
    </div>
  );
}
