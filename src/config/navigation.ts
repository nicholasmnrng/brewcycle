import {
  BarChart3,
  Gift,
  History,
  Home,
  ImageIcon,
  ListChecks,
  Map,
  Package,
  ScrollText,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Truck,
  User
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const roleNavigation: Record<"ADMIN" | "CAFE" | "DRIVER" | "BUYER", NavigationItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Logistik", href: "/dashboard/logistics", icon: Truck },
    { label: "Produk", href: "/dashboard/products", icon: Package },
    { label: "Pesanan", href: "/dashboard/orders", icon: ShoppingCart },
    { label: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Promo", href: "/dashboard/promos", icon: Sparkles },
    { label: "Proof", href: "/dashboard/proof", icon: ImageIcon },
    { label: "Master Data", href: "/dashboard/master-data", icon: ShieldCheck },
    { label: "Audit Log", href: "/dashboard/audit-log", icon: ScrollText },
    { label: "Gamifikasi & Reward", href: "/dashboard/gamification", icon: ListChecks }
  ],
  CAFE: [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Pickup", href: "/dashboard/pickup", icon: Truck },
    { label: "Impact", href: "/dashboard/impact", icon: BarChart3 },
    { label: "Reward", href: "/dashboard/rewards", icon: Gift },
    { label: "Profile", href: "/dashboard/profile", icon: User }
  ],
  DRIVER: [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Task", href: "/dashboard/tasks", icon: Truck },
    { label: "Map", href: "/dashboard/map", icon: Map },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Profile", href: "/dashboard/profile", icon: User }
  ],
  BUYER: [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Produk", href: "/dashboard/products", icon: Package },
    { label: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Profile", href: "/dashboard/profile", icon: User }
  ]
} as const;

export type AppRole = keyof typeof roleNavigation;
