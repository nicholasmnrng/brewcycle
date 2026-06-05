"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CartBadgeState, NavItem } from "@/components/nav-item";
import { roleNavigation, type AppRole, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  role: AppRole;
  user: {
    name?: string | null;
    points: number;
    referralCode: string;
  };
  children: React.ReactNode;
};

export function AppShell({ role, user, children }: AppShellProps) {
  const items = roleNavigation[role];
  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-screen">
      {isAdmin ? (
        <DesktopSidebar items={items} user={user} />
      ) : (
        <DesktopTopNav items={items} role={role} user={user} />
      )}
      <main className={cn("pb-24 sm:pb-8", isAdmin ? "lg:pl-72" : "")}>
        <div className="app-container py-6 sm:py-8">{children}</div>
      </main>
      <MobileBottomNav items={items} />
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-950">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
        <Leaf className="h-5 w-5" />
      </span>
      BrewCycle
    </Link>
  );
}

function DesktopSidebar({
  items,
  user
}: {
  items: NavigationItem[];
  user: AppShellProps["user"];
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-white/90 px-4 py-5 shadow-soft backdrop-blur lg:block">
      <Brand />
      <nav className="mt-8 space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>
      <div className="absolute inset-x-4 bottom-5 rounded-[1.25rem] border bg-coffee-soft p-3">
        <p className="truncate text-sm font-semibold text-slate-950">{user.name ?? "Pengguna"}</p>
        <p className="mt-1 text-xs text-slate-500">Referral: {user.referralCode}</p>
        <div className="mt-3 flex items-center gap-2">
          <NotificationBell />
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}

function DesktopTopNav({
  items,
  role,
  user
}: {
  items: NavigationItem[];
  role: AppRole;
  user: AppShellProps["user"];
}) {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-white/90 shadow-sm backdrop-blur sm:block">
      <div className="app-container flex h-16 items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-1">
          {items.map((item) => (
            <CartBadgeState key={item.href}>
              {(cartCount) => <NavItem item={item} badgeCount={item.href.endsWith("/cart") ? cartCount : 0} />}
            </CartBadgeState>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-950">{user.name ?? role}</p>
            <p className="text-xs text-slate-500">{user.points} poin</p>
          </div>
          <NotificationBell />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({
  items
}: {
  items: NavigationItem[];
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 shadow-premium backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
        {items.slice(0, 5).map((item) => (
          <CartBadgeState key={item.href}>
            {(cartCount) => (
              <NavItem item={item} vertical badgeCount={item.href.endsWith("/cart") ? cartCount : 0} />
            )}
          </CartBadgeState>
        ))}
      </div>
    </nav>
  );
}
