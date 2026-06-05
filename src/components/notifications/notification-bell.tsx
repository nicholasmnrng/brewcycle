"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { BadgeNotification, NotificationEmpty } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  createdAt: string;
  isRead: boolean;
};

export function NotificationBell({ initialCount = 0 }: { initialCount?: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setItems(data.notifications ?? []);
    setCount(data.unread ?? 0);
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  function markRead() {
    startTransition(async () => {
      await fetch("/api/notifications", { method: "PATCH" });
      await load();
    });
  }

  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="relative bg-white" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-4 w-4" />
        <span className="absolute -right-1 -top-1">
          <BadgeNotification count={count} />
        </span>
      </Button>
      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[1.35rem] border bg-white p-3 shadow-premium">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="font-semibold text-slate-950">Notifikasi</p>
              <p className="text-xs text-slate-500">{count} belum dibaca</p>
            </div>
            <Button size="sm" variant="ghost" disabled={isPending || count === 0} onClick={markRead}>
              Tandai baca
            </Button>
          </div>
          <div className="max-h-96 space-y-2 overflow-auto">
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border p-3",
                    item.isRead ? "bg-white" : "border-eco/20 bg-eco-soft"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  {item.message ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p> : null}
                  <p className="mt-2 text-[11px] text-slate-400">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(item.createdAt)
                    )}
                  </p>
                </div>
              ))
            ) : (
              <NotificationEmpty />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
