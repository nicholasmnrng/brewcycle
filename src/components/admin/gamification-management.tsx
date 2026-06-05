"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/notifications/toast-provider";

type ConfigRow = {
  id: string;
  key: string;
  label: string;
  value: string;
  description: string | null;
  isActive: boolean;
};

export function GamificationManagement({ configs }: { configs: ConfigRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const defaults = [
    { key: "pickup_points_per_kg", label: "Poin pickup per kg", value: "10", description: "Poin Cafe untuk setiap kg ampas kopi completed." },
    { key: "purchase_points_per_10000", label: "Poin pembelian per Rp10.000", value: "5", description: "Legacy backend Buyer points, disembunyikan dari UI Buyer." },
    { key: "referral_bonus", label: "Bonus referral", value: "50", description: "Bonus saat referee menyelesaikan transaksi/pickup pertama." }
  ];
  const rows = defaults.map((item) => configs.find((config) => config.key === item.key) ?? item);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await fetch("/api/admin/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const data = await response.json();
      if (!response.ok) {
        notify({ title: "Konfigurasi gagal disimpan", description: data.message, type: "error" });
        return;
      }
      notify({ title: "Konfigurasi gamifikasi tersimpan", type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-eco" />
              {row.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submit}>
              <input type="hidden" name="key" value={row.key} />
              <input type="hidden" name="label" value={row.label} />
              <div className="space-y-2">
                <Label>Nilai</Label>
                <Input name="value" type="number" min="0" defaultValue={row.value} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea name="description" defaultValue={row.description ?? ""} />
              </div>
              <Button disabled={isPending}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
