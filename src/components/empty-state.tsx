import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref
}: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-white p-8 text-center shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-soft text-eco">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel && actionHref ? (
        <Button className="mt-5" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
