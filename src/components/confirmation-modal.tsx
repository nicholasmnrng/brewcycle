"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  destructive,
  isPending,
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-coffee-dark/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border bg-white p-6 shadow-premium">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3d8] text-[#9a5b00]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
