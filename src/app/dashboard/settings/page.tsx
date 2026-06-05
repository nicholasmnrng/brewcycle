import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Pengaturan"
      description="Pengaturan operasional admin disiapkan untuk fase setelah modul inti aktif."
      icon={Settings}
    />
  );
}
