import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type AuditLogRow = {
  id: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  module: string;
  entityId: string | null;
  createdAt: Date;
};

export function AuditLogTable({ rows }: { rows: AuditLogRow[] }) {
  if (!rows.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500">
          Belum ada audit log. Aktivitas penting akan muncul setelah sistem digunakan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.35rem] border bg-white shadow-soft">
      <div className="hidden grid-cols-[160px_1fr_120px_140px_1fr] gap-4 border-b bg-coffee-soft px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
        <span>Waktu</span>
        <span>User</span>
        <span>Role</span>
        <span>Modul</span>
        <span>Aksi</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[160px_1fr_120px_140px_1fr] md:items-center">
          <p className="text-sm text-slate-500">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(row.createdAt)}
          </p>
          <p className="font-medium text-slate-950">{row.actorName ?? "System"}</p>
          <div>{row.actorRole ? <Badge variant="outline">{row.actorRole}</Badge> : <Badge variant="outline">SYSTEM</Badge>}</div>
          <p className="text-sm font-semibold text-primary">{row.module}</p>
          <p className="text-sm text-slate-600">
            {row.action}
            {row.entityId ? <span className="text-slate-400"> #{row.entityId.slice(0, 8)}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}
