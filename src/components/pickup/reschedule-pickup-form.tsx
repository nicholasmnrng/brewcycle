"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReschedulePickupFormProps = {
  pickupId: string;
};

export function ReschedulePickupForm({ pickupId }: ReschedulePickupFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    formData.set("pickup_id", pickupId);

    startTransition(async () => {
      const response = await fetch("/api/pickup/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Reschedule gagal");
        return;
      }

      setMessage("Jadwal berhasil diperbarui");
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <CalendarClock className="h-4 w-4" />
        Reschedule
      </Button>
    );
  }

  return (
    <form className="mt-4 space-y-3 rounded-xl border bg-slate-50 p-3" onSubmit={handleSubmit}>
      <input type="hidden" name="pickup_id" value={pickupId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`date-${pickupId}`}>Tanggal Baru</Label>
          <Input id={`date-${pickupId}`} name="schedule_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`slot-${pickupId}`}>Slot Baru</Label>
          <Select id={`slot-${pickupId}`} name="slot" defaultValue="MORNING" required>
            <option value="MORNING">Pagi, 09:00</option>
            <option value="AFTERNOON">Siang, 13:00</option>
            <option value="EVENING">Sore, 16:00</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`reason-${pickupId}`}>Alasan</Label>
        <Textarea id={`reason-${pickupId}`} name="reason" required minLength={3} />
      </div>
      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
      <div className="flex gap-2">
        <Button disabled={isPending} size="sm">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
