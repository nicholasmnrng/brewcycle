"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Pendaftaran gagal");
        return;
      }

      router.push("/login");
    });
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="CAFE" required>
              <option value="CAFE">Kafe</option>
              <option value="DRIVER">Driver</option>
              <option value="BUYER">Buyer</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode">Kode Referral</Label>
            <Input id="referralCode" name="referralCode" placeholder="Opsional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {message ? <p className="text-sm font-medium text-destructive">{message}</p> : null}
          <Button className="w-full" disabled={isPending}>
            <UserPlus className="h-4 w-4" />
            {isPending ? "Memproses..." : "Daftar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
