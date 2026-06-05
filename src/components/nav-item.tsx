"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/config/navigation";
import { BadgeNotification } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";

export function NavItem({
  item,
  vertical,
  badgeCount = 0
}: {
  item: NavigationItem;
  vertical?: boolean;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all",
        vertical && "flex-col justify-center gap-1 px-2 text-[11px]",
        active ? "bg-eco-soft text-eco shadow-sm" : "text-slate-600 hover:bg-white hover:text-primary"
      )}
    >
      <item.icon className={vertical ? "h-5 w-5" : "h-4 w-4"} />
      <span>{item.label}</span>
      {badgeCount ? (
        <span className={cn(vertical ? "absolute right-3 top-1" : "ml-auto")}>
          <BadgeNotification count={badgeCount} />
        </span>
      ) : null}
    </Link>
  );
}

export function CartBadgeState({ children }: { children: (count: number) => React.ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCart() {
      const cart = JSON.parse(window.localStorage.getItem("brewcycle-cart") ?? "[]") as Array<{ qty: number }>;
      setCount(cart.reduce((sum, item) => sum + Number(item.qty ?? 0), 0));
    }

    readCart();
    window.addEventListener("brewcycle-cart-updated", readCart);
    window.addEventListener("storage", readCart);
    return () => {
      window.removeEventListener("brewcycle-cart-updated", readCart);
      window.removeEventListener("storage", readCart);
    };
  }, []);

  return <>{children(count)}</>;
}
