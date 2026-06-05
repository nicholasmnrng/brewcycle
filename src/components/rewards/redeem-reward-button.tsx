"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/notifications/toast-provider";

export function RedeemRewardButton({
  catalogId,
  pointsRequired
}: {
  catalogId: string;
  pointsRequired: number;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function redeem() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/reward/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog_id: catalogId, points_used: pointsRequired })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Redeem gagal");
        notify({ title: "Redeem gagal", description: data.message, type: "error" });
        return;
      }

      setMessage(`${data.message}. Saldo baru: ${data.new_balance}`);
      notify({ title: "Reward berhasil ditukar", description: `Saldo baru: ${data.new_balance}`, type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={redeem} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
        {isPending ? "Menukar..." : "Redeem"}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
