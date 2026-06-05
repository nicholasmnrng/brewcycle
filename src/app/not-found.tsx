import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="app-container flex min-h-screen items-center justify-center py-10">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-warning">
          <SearchX className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Rute yang kamu buka tidak tersedia di BrewCycle.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Kembali</Link>
        </Button>
      </div>
    </main>
  );
}
