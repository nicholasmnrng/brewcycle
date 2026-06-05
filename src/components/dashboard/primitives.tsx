import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Bell, CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RoleDashboardLayout({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function DashboardHero({
  badge,
  title,
  description,
  cta,
  icon: Icon
}: {
  badge: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  icon?: LucideIcon;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-coffee-dark p-6 text-white shadow-premium sm:p-8">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(244,184,96,0.25),transparent_55%)]" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="bg-white/12 text-white">{badge}</Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber sm:flex">
              <Icon className="h-7 w-7" />
            </div>
          ) : null}
          {cta ? (
            <Button asChild className="bg-white text-coffee-dark hover:bg-amber">
              <Link href={cta.href}>
                {cta.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "green"
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: "green" | "coffee" | "amber" | "red";
}) {
  const toneClass = {
    green: "bg-eco-soft text-eco",
    coffee: "bg-coffee-soft text-primary",
    amber: "bg-[#fff3d8] text-[#9a5b00]",
    red: "bg-red-50 text-red-600"
  }[tone];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-500">{label}</CardTitle>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      {description ? <CardContent><p className="text-sm text-slate-500">{description}</p></CardContent> : null}
    </Card>
  );
}

export function BentoCard({
  title,
  description,
  children,
  className,
  action
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function QuickActionCard({
  href,
  title,
  description,
  icon: Icon
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group block rounded-[1.35rem] border bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-eco-soft text-eco">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export function ActivityTimeline({
  items
}: {
  items: Array<{ title: string; description?: string; time?: string; status?: string }>;
}) {
  if (!items.length) {
    return <p className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">Belum ada aktivitas terbaru.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-soft text-eco">
            {item.status === "FAILED" || item.status === "REJECTED" ? (
              <CircleAlert className="h-4 w-4" />
            ) : item.status === "COMPLETED" || item.status === "VERIFIED" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-950">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p> : null}
            {item.time ? <p className="mt-1 text-xs text-slate-400">{item.time}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PickupStatusTimeline({ status }: { status?: string }) {
  const steps = ["PENDING", "ASSIGNED", "IN_TRANSIT", "WAITING_OTP", "COMPLETED"];
  const currentIndex = Math.max(0, steps.indexOf(status ?? "PENDING"));

  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <div
            key={step}
            className={cn(
              "rounded-2xl border px-3 py-3 text-xs font-semibold",
              active ? "border-eco/20 bg-eco-soft text-eco" : "border-border bg-white text-slate-400"
            )}
          >
            {step.replace("_", " ")}
          </div>
        );
      })}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge variant={role === "ADMIN" ? "secondary" : "default"}>{role}</Badge>;
}

export function BadgeNotification({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold text-coffee-dark">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function MiniChartCard({
  title,
  value,
  children
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function NotificationEmpty() {
  return (
    <div className="rounded-2xl bg-coffee-soft p-4 text-sm text-slate-500">
      <Bell className="mb-2 h-5 w-5 text-primary" />
      Belum ada notifikasi baru.
    </div>
  );
}
