"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/notifications/toast-provider";

type DriverPickupActionsProps = {
  pickupId: string;
  status: string;
};

export function DriverPickupActions({ pickupId, status }: DriverPickupActionsProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [message, setMessage] = useState("");
  const [isCompleteOpen, setIsCompleteOpen] = useState(status === "IN_TRANSIT" || status === "WAITING_OTP");
  const [isPending, startTransition] = useTransition();

  function checkIn() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("GPS tidak tersedia di perangkat ini");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const response = await fetch("/api/pickup/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pickup_id: pickupId,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          });
          const data = await response.json();

          if (!response.ok) {
            setMessage(data.message ?? "Check-in gagal");
            notify({ title: "Check-in gagal", description: data.message, type: "error" });
            return;
          }

          setMessage(data.otp_hint);
          notify({ title: "Check-in berhasil", description: data.otp_hint, type: "success", browser: true });
          setIsCompleteOpen(true);
          router.refresh();
        });
      },
      () => setMessage("Izin GPS dibutuhkan untuk check-in")
    );
  }

  function completePickup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    formData.set("pickup_id", pickupId);

    startTransition(async () => {
      const response = await fetch("/api/pickup/complete", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Submit pickup gagal");
        notify({ title: "Submit pickup gagal", description: data.message, type: "error" });
        router.refresh();
        return;
      }

      setMessage(`Pickup selesai. Poin kafe: ${data.points_earned}`);
      notify({ title: "Pickup selesai", description: `Poin kafe: ${data.points_earned}`, type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {status === "ASSIGNED" ? (
        <Button className="w-full sm:w-auto" onClick={checkIn} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {isPending ? "Verifikasi..." : "Check-in GPS"}
        </Button>
      ) : null}

      {isCompleteOpen ? (
        <form className="space-y-3 rounded-xl border bg-slate-50 p-3" onSubmit={completePickup}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`weight-${pickupId}`}>Berat Aktual</Label>
              <Input id={`weight-${pickupId}`} name="actual_weight" type="number" min="0.1" step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`otp-${pickupId}`}>OTP Kafe</Label>
              <Input id={`otp-${pickupId}`} name="otp_input" inputMode="numeric" maxLength={6} minLength={6} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`photo-${pickupId}`}>Bukti Foto</Label>
            <Input id={`photo-${pickupId}`} name="photo" type="file" accept=".jpg,.jpeg,.png" required />
            <p className="text-xs text-slate-500">Format .jpg/.png, maksimal 5MB.</p>
          </div>
          <Button disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {isPending ? "Mengirim..." : "Submit Pickup"}
          </Button>
        </form>
      ) : null}

      {message ? (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
