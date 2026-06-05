import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { fileToDataUrl } from "@/lib/files";

const productSchema = z.object({
  category: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(5),
  usage_guide: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  unit: z.string().min(1)
});

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa mengubah produk" }, { status: 403 });
  }

  const formData = await request.formData();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  const image = formData.get("image");

  if (!parsed.success) {
    return NextResponse.json({ message: "Input produk tidak valid" }, { status: 400 });
  }

  if (image instanceof File && image.size > 0 && (!allowedImageTypes.includes(image.type) || image.size > maxImageSize)) {
    return NextResponse.json({ message: "Foto produk harus .jpg/.png dan maksimal 5MB" }, { status: 400 });
  }

  const imageUrl = image instanceof File && image.size > 0 ? await fileToDataUrl(image) : undefined;

  const [product] = await db
    .update(products)
    .set({
      category: parsed.data.category,
      name: parsed.data.name,
      description: parsed.data.description,
      usageGuide: parsed.data.usage_guide,
      ...(imageUrl ? { imageUrl } : {}),
      price: parsed.data.price.toFixed(2),
      stock: parsed.data.stock,
      unit: parsed.data.unit
    })
    .where(eq(products.id, params.id))
    .returning({ id: products.id, name: products.name });

  if (!product) {
    return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
  }

  await writeAuditLog(db, {
    actor: session.user,
    action: "UPDATE_PRODUCT",
    module: "PRODUCT",
    entityId: product.id,
    detail: { name: product.name }
  });

  return NextResponse.json({ id: product.id });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa menghapus produk" }, { status: 403 });
  }

  await db.delete(products).where(eq(products.id, params.id));
  await writeAuditLog(db, {
    actor: session.user,
    action: "DELETE_PRODUCT",
    module: "PRODUCT",
    entityId: params.id
  });

  return NextResponse.json({ success: true });
}
