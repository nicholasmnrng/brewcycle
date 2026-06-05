"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ redirect: false });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {isPending ? "Keluar..." : "Keluar"}
    </Button>
  );
}