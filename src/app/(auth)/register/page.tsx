import Link from "next/link";
import { Leaf } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Daftar BrewCycle</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pilih role MVP yang tersedia: Kafe, Driver, atau Buyer.
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
