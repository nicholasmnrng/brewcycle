import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PlaceholderPage({ eyebrow, title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">{eyebrow}</Badge>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle>Disiapkan sesuai urutan PRD</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Halaman ini sudah masuk dalam shell navigasi role, namun detail fiturnya akan
            dikerjakan pada bagian agent berikutnya agar scope MVP tetap terkendali.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
