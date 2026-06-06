import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { auth } from "@/auth";
import { PlaceholderPage } from "@/components/placeholder-page";
import { dashboardHomeForRole } from "@/lib/role-routing";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect(dashboardHomeForRole(session.user.role));
  }

  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Pengaturan"
      description="Pengaturan operasional admin disiapkan untuk fase setelah modul inti aktif."
      icon={Settings}
    />
  );
}
