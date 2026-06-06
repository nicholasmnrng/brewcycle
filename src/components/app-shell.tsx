"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Leaf, MoreHorizontal, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CartBadgeState, NavItem } from "@/components/nav-item";
import { Button } from "@/components/ui/button";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasOverflow = items.length > 5;
  const primaryItems = hasOverflow ? items.slice(0, 4) : items.slice(0, 5);
  const overflowItems = hasOverflow ? items.slice(4) : [];
  const moreActive = overflowItems.some((item) => isNavigationItemActive(item, pathname));

  return (
    <>
      {open && hasOverflow ? (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-40 bg-coffee-dark/30 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-[4.75rem] z-50 px-3 sm:hidden">
            <div className="mx-auto max-w-md rounded-t-[1.5rem] border border-border bg-white p-4 shadow-premium">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">Menu Admin</p>
                  <p className="text-xs text-slate-500">Akses semua fitur operasional BrewCycle.</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Tutup menu" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid max-h-[56vh] gap-2 overflow-y-auto pb-1">
                {items.map((item) => (
                  <div key={item.href} onClick={() => setOpen(false)}>
                    <CartBadgeState>
                      {(cartCount) => (
                        <NavItem item={item} badgeCount={item.href.endsWith("/cart") ? cartCount : 0} />
                      )}
                    </CartBadgeState>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 shadow-premium backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
          {primaryItems.map((item) => (
            <CartBadgeState key={item.href}>
              {(cartCount) => (
                <NavItem item={item} vertical badgeCount={item.href.endsWith("/cart") ? cartCount : 0} />
              )}
            </CartBadgeState>
          ))}
          {hasOverflow ? (
            <button
              type="button"
              aria-expanded={open}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition-all",
                moreActive || open ? "bg-eco-soft text-eco shadow-sm" : "text-slate-600 hover:bg-white hover:text-primary"
              )}
              onClick={() => setOpen((value) => !value)}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          ) : null}
        </div>
      </nav>
    </>
  );
}

function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
}
