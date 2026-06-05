"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-container flex min-h-screen items-center justify-center py-10">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">Terjadi kendala</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kami belum bisa memuat data saat ini. Coba ulangi, dan pastikan koneksi tetap stabil.
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          Coba lagi
        </Button>
      </div>
    </main>
  );
}
