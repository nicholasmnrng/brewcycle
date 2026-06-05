"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/notifications/toast-provider";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CAFE" | "DRIVER" | "BUYER";
  isActive: boolean;
  driverOnline: boolean;
};

export function MasterDataClient({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(
    () =>
      users
        .filter((user) => role === "ALL" || user.role === role)
        .filter((user) => status === "ALL" || (status === "ACTIVE" ? user.isActive : !user.isActive))
        .filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, role, status, query]
  );

  function updateStatus(user: UserRow) {
    startTransition(async () => {
      const response = await fetch("/api/admin/master-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, is_active: !user.isActive })
      });
      const data = await response.json();

      if (!response.ok) {
        notify({ title: "Status akun gagal diubah", description: data.message, type: "error" });
        return;
      }

      notify({ title: user.isActive ? "Akun dinonaktifkan" : "Akun diaktifkan", type: "success", browser: true });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[1.35rem] border bg-white p-4 shadow-soft lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau email..." />
        </div>
        <Select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="ALL">Semua role</option>
          <option value="ADMIN">Admin</option>
          <option value="CAFE">Cafe</option>
          <option value="DRIVER">Driver</option>
          <option value="BUYER">Buyer</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">Semua status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </Select>
      </div>
      <div className="overflow-hidden rounded-[1.35rem] border bg-white shadow-soft">
        {filtered.map((user) => (
          <div key={user.id} className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1.2fr_1fr_120px_120px_140px] lg:items-center">
            <div>
              <p className="font-semibold text-slate-950">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <p className="text-sm text-slate-500">{user.phone ?? "-"}</p>
            <Badge variant="outline">{user.role}</Badge>
            <Badge variant={user.isActive ? "default" : "destructive"}>{user.isActive ? "Active" : "Inactive"}</Badge>
            <Button variant={user.isActive ? "destructive" : "secondary"} size="sm" disabled={isPending} onClick={() => updateStatus(user)}>
              {user.isActive ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
