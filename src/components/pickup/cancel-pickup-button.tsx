"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/notifications/toast-provider";

export function CancelPickupButton({ pickupId }: { pickupId: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function cancelPickup() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/pickup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup_id: pickupId })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Pickup gagal dibatalkan");
        notify({ title: "Cancel gagal", description: data.message ?? "Pickup gagal dibatalkan", type: "error" });
        return;
      }

      setMessage(`Status pickup: ${data.status}`);
      notify({ title: "Pickup dibatalkan", description: `Status pickup: ${data.status}`, type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" size="sm" onClick={cancelPickup} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
        Batalkan
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
