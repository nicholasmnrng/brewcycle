import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { promos } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa menghapus promo" }, { status: 403 });
  }

  const [promo] = await db
    .update(promos)
    .set({ status: "DISABLED", isDisabled: true })
    .where(eq(promos.id, params.id))
    .returning({ id: promos.id, title: promos.title });

  if (!promo) {
    return NextResponse.json({ message: "Promo tidak ditemukan" }, { status: 404 });
  }

  await writeAuditLog(db, {
    actor: session.user,
    action: "DISABLE_PROMO",
    module: "PROMO",
    entityId: promo.id,
    detail: { title: promo.title }
  });

  return NextResponse.json({ id: promo.id, status: "DISABLED" });
}
