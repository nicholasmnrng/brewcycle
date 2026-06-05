"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type AssignDriverFormProps = {
  pickupId: string;
  drivers: Array<{ id: string; name: string }>;
};

export function AssignDriverForm({ pickupId, drivers }: AssignDriverFormProps) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/pickup/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup_id: pickupId, driver_id: driverId })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Assign gagal");
        return;
      }

      setMessage("Driver berhasil di-assign");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={driverId} onChange={(event) => setDriverId(event.target.value)} disabled={!drivers.length}>
          {drivers.length ? (
            drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))
          ) : (
            <option>Belum ada driver</option>
          )}
        </Select>
        <Button type="button" onClick={handleAssign} disabled={!driverId || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          {isPending ? "Assign..." : "Assign"}
        </Button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
