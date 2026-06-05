import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell
      role={session.user.role}
      user={{
        name: session.user.name,
        points: session.user.totalPoints,
        referralCode: session.user.referralCode
      }}
    >
      {children}
    </AppShell>
  );
}
