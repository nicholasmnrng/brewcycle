import Link from "next/link";
import { ArrowRight, Leaf, Recycle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Logistik Pickup",
    description: "Jadwal, assignment driver, GPS, OTP, dan bukti foto siap dipasang di fase berikutnya.",
    icon: Recycle
  },
  {
    title: "Poin Transparan",
    description: "Ledger rewards disiapkan untuk earning pickup, purchase, referral, dan redemption.",
    icon: ShieldCheck
  },
  {
    title: "Dampak Lingkungan",
    description: "Koefisien CO2, methane, dan pohon tersimpan sebagai konfigurasi database.",
    icon: Leaf
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="app-container flex min-h-screen flex-col justify-center gap-8 py-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
            BrewCycle MVP Foundation
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Platform sirkular ekonomi hijau untuk ampas kopi.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Fondasi aplikasi, design system, dan schema PostgreSQL sudah diarahkan
            sesuai PRD: clean, mobile-first, role-aware, dan siap untuk alur pickup,
            marketplace, poin, serta impact dashboard.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">
              Masuk ke dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
