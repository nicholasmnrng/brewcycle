"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Bell, Loader2, LogOut, Shield, UserRound } from "lucide-react";
import { useToast } from "@/components/notifications/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProfileClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    birthDate: string | null;
    gender: string | null;
    notificationsEnabled: boolean;
    privacyMode: boolean;
    driverOnline: boolean;
    createdAt: Date;
  };
  activityCount: number;
};

export function ProfileClient({ user, activityCount }: ProfileClientProps) {
  const { notify } = useToast();
  const [online, setOnline] = useState(user.driverOnline);
  const [isPending, startTransition] = useTransition();

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          birth_date: formData.get("birth_date"),
          gender: formData.get("gender"),
          notifications_enabled: formData.get("notifications_enabled") === "on",
          privacy_mode: formData.get("privacy_mode") === "on"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        notify({ title: "Profil gagal disimpan", description: data.message, type: "error" });
        return;
      }

      notify({ title: "Profil tersimpan", description: "Pengaturan akun diperbarui.", type: "success", browser: true });
    });
  }

  function toggleDriverStatus() {
    startTransition(async () => {
      const nextOnline = !online;
      const response = await fetch("/api/driver/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: nextOnline })
      });
      const data = await response.json();

      if (!response.ok) {
        notify({ title: "Status gagal diubah", description: data.message, type: "error" });
        return;
      }

      setOnline(data.online);
      notify({
        title: data.online ? "Driver online" : "Driver offline",
        description: data.online ? "Kamu siap menerima tugas." : "Kamu tidak menerima tugas baru.",
        type: "success",
        browser: true
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <UserRound className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-slate-600">Role</p>
              <p className="font-semibold text-slate-950">{user.role}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-slate-600">Notifikasi</p>
              <p className="font-semibold text-slate-950">{user.notificationsEnabled ? "Aktif" : "Nonaktif"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-slate-600">Aktivitas</p>
              <p className="font-semibold text-slate-950">{activityCount} item</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.role === "DRIVER" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">Status Driver</p>
              <p className="text-sm text-slate-600">{online ? "Online dan siap menerima tugas." : "Offline."}</p>
            </div>
            <Button variant={online ? "secondary" : "default"} onClick={toggleDriverStatus} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {online ? "Set Offline" : "Set Online"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun & Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input name="name" defaultValue={user.name} required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Nomor HP</Label>
                <Input name="phone" type="tel" defaultValue={user.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input name="birth_date" type="date" defaultValue={user.birthDate ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select name="gender" defaultValue={user.gender ?? ""}>
                  <option value="">Pilih</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                  <option value="other">Lainnya</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kata Sandi</Label>
                <Input value="Dikelola melalui sesi login" disabled />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <input name="notifications_enabled" type="checkbox" defaultChecked={user.notificationsEnabled} />
                Notifikasi aktif
              </label>
              <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <input name="privacy_mode" type="checkbox" defaultChecked={user.privacyMode} />
                Mode privasi
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan Profil
              </Button>
              <Button type="button" variant="outline" onClick={() => Notification.requestPermission()}>
                Izinkan Push
              </Button>
              <Button type="button" variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat/Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Akun dibuat {new Intl.DateTimeFormat("id-ID").format(user.createdAt)}</Badge>
            <Badge variant="outline">{activityCount} aktivitas tercatat</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
