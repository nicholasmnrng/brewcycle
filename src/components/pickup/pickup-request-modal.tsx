"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/notifications/toast-provider";

export function PickupRequestModal() {
  const router = useRouter();
  const { notify } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [locationMessage, setLocationMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function useCurrentLocation() {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage("GPS tidak tersedia di perangkat ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(7),
          lng: position.coords.longitude.toFixed(7)
        });
        setLocationMessage("Titik pickup berhasil diambil dari lokasi perangkat.");
      },
      () => setLocationMessage("Izin lokasi dibutuhkan untuk mengisi titik pickup.")
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setOtpCode("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await fetch("/api/pickup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Gagal membuat jadwal pickup");
        notify({ title: "Pickup gagal", description: data.message ?? "Gagal membuat jadwal pickup", type: "error" });
        return;
      }

      setOtpCode(data.otp_code);
      setMessage("");
      form.reset();
      setLocation({ lat: "", lng: "" });
      setIsOpen(false);
      notify({
        title: "Pickup berhasil dijadwalkan",
        description: "OTP bisa dicek di detail riwayat pickup.",
        type: "success",
        browser: true
      });
      router.refresh();
    });
  }

  return (
    <>
      <div className="fixed inset-x-4 bottom-20 z-30 sm:static sm:inset-auto">
        <Button className="w-full sm:w-auto" size="lg" onClick={() => setIsOpen(true)}>
          <CalendarPlus className="h-4 w-4" />
          Jadwalkan Pickup
        </Button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 sm:flex sm:items-center sm:justify-center sm:p-6">
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:relative sm:bottom-auto sm:w-full sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Form Penjadwalan</h2>
                <p className="text-sm text-slate-600">Lengkapi detail pickup agar driver bisa verifikasi lokasi.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="pickup_address">Alamat Pickup</Label>
                <Textarea
                  id="pickup_address"
                  name="pickup_address"
                  placeholder="Nama jalan, nomor, patokan, lantai/area loading"
                  required
                  minLength={10}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">PIC Pickup</Label>
                  <Input id="contact_name" name="contact_name" required minLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Nomor PIC</Label>
                  <Input id="contact_phone" name="contact_phone" type="tel" required minLength={8} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titik GPS Pickup</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    name="pickup_latitude"
                    value={location.lat}
                    onChange={(event) => setLocation((current) => ({ ...current, lat: event.target.value }))}
                    placeholder="Latitude"
                    required
                  />
                  <Input
                    name="pickup_longitude"
                    value={location.lng}
                    onChange={(event) => setLocation((current) => ({ ...current, lng: event.target.value }))}
                    placeholder="Longitude"
                    required
                  />
                  <Button type="button" variant="outline" onClick={useCurrentLocation}>
                    <MapPin className="h-4 w-4" />
                    Ambil
                  </Button>
                </div>
                {locationMessage ? <p className="text-xs text-slate-500">{locationMessage}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_weight">Estimasi Berat Ampas</Label>
                <Input
                  id="estimated_weight"
                  name="estimated_weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Contoh: 12.5"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule_date">Tanggal</Label>
                  <Input id="schedule_date" name="schedule_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot">Slot</Label>
                  <Select id="slot" name="slot" defaultValue="MORNING" required>
                    <option value="MORNING">Pagi, 09:00</option>
                    <option value="AFTERNOON">Siang, 13:00</option>
                    <option value="EVENING">Sore, 16:00</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zone">Zona Area</Label>
                  <Input id="zone" name="zone" placeholder="Contoh: Denpasar Utara" required minLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup_notes">Catatan</Label>
                  <Input id="pickup_notes" name="pickup_notes" placeholder="Opsional" />
                </div>
              </div>
              {message ? (
                <Card className="bg-green-50 shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm text-primary">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-slate-700">{message}</p>
                    {otpCode ? (
                      <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-2xl font-bold tracking-widest text-slate-950">
                        {otpCode}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
              <Button className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
