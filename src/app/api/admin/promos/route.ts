import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { promos } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";

const promoSchema = z.object({
  product_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(3),
  description: z.string().min(5),
  discount_type: z.enum(["PERCENT", "NOMINAL"]),
  discount_value: z.coerce.number().min(0),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED", "DISABLED"])
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ message: "Hanya Admin yang bisa mengelola promo" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const parsed = promoSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Input promo tidak valid" }, { status: 400 });
  }

  const [promo] = await db
    .insert(promos)
    .values({
      productId: parsed.data.product_id || null,
      title: parsed.data.title,
      description: parsed.data.description,
      discountType: parsed.data.discount_type,
      discountValue: parsed.data.discount_value.toFixed(2),
      startsAt: parsed.data.starts_at ? new Date(parsed.data.starts_at) : null,
      endsAt: parsed.data.ends_at ? new Date(parsed.data.ends_at) : null,
      status: parsed.data.status,
      isDisabled: parsed.data.status === "DISABLED"
    })
    .returning({ id: promos.id, title: promos.title });

  await writeAuditLog(db, {
    actor: guard.session.user,
    action: "CREATE_PROMO",
    module: "PROMO",
    entityId: promo.id,
    detail: { title: promo.title }
  });
  await createNotification(db, {
    role: "BUYER",
    type: "INFO",
    title: "Promo baru tersedia",
    message: promo.title,
    module: "PROMO",
    entityId: promo.id
  });

  return NextResponse.json({ id: promo.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = await request.json();
  const parsed = promoSchema.extend({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Input promo tidak valid" }, { status: 400 });
  }

  const [promo] = await db
    .update(promos)
    .set({
      productId: parsed.data.product_id || null,
      title: parsed.data.title,
      description: parsed.data.description,
      discountType: parsed.data.discount_type,
      discountValue: parsed.data.discount_value.toFixed(2),
      startsAt: parsed.data.starts_at ? new Date(parsed.data.starts_at) : null,
      endsAt: parsed.data.ends_at ? new Date(parsed.data.ends_at) : null,
      status: parsed.data.status,
      isDisabled: parsed.data.status === "DISABLED"
    })
    .where(eq(promos.id, parsed.data.id))
    .returning({ id: promos.id, title: promos.title });

  if (!promo) {
    return NextResponse.json({ message: "Promo tidak ditemukan" }, { status: 404 });
  }

  await writeAuditLog(db, {
    actor: guard.session.user,
    action: "UPDATE_PROMO",
    module: "PROMO",
    entityId: promo.id,
    detail: { title: promo.title }
  });

  return NextResponse.json({ id: promo.id });
}
