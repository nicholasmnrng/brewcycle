import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { orderItems, orders, products, promos } from "@/db/schema";
import { createNotification, writeAuditLog } from "@/lib/audit";
import { fileToDataUrl } from "@/lib/files";
import { bestPromoForProduct } from "@/lib/promos";

const createOrderSchema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), qty: z.coerce.number().int().positive() })).min(1),
  total_price: z.coerce.number().min(0),
  shipping_recipient: z.string().min(2, "Nama penerima wajib diisi"),
  shipping_phone: z.string().min(8, "Nomor penerima minimal 8 karakter"),
  shipping_address: z.string().min(10, "Alamat pengiriman minimal 10 karakter")
});

const maxProofSize = 5 * 1024 * 1024;
const allowedProofTypes = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "BUYER") {
    return NextResponse.json({ message: "Hanya Buyer yang bisa membuat order" }, { status: 403 });
  }

  const { payload, proof } = await parseOrderPayload(request);
  const parsed = createOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Input order tidak valid" }, { status: 400 });
  }

  if (proof && (!allowedProofTypes.includes(proof.type) || proof.size > maxProofSize)) {
    return NextResponse.json(
      { message: "Bukti transfer harus .jpg/.png dan maksimal 5MB" },
      { status: 400 }
    );
  }

  const productIds = parsed.data.items.map((item) => item.product_id);
  const [productRows, promoRows] = await Promise.all([
    db.select().from(products).where(inArray(products.id, productIds)),
    db.select().from(promos).where(eq(promos.status, "ACTIVE"))
  ]);
  const productMap = new Map(productRows.map((product) => [product.id, product]));
  const proofUrl = proof ? await fileToDataUrl(proof) : null;

  let calculatedTotal = 0;
  const pricedItems: Array<{
    product_id: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }> = [];

  for (const item of parsed.data.items) {
    const product = productMap.get(item.product_id);

    if (!product) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.stock < item.qty) {
      return NextResponse.json({ message: `Stok ${product.name} tidak cukup` }, { status: 409 });
    }

    const promo = bestPromoForProduct(product.id, Number(product.price), promoRows);
    const unitPrice = promo?.finalPrice ?? Number(product.price);
    const subtotal = unitPrice * item.qty;

    pricedItems.push({
      ...item,
      unitPrice,
      subtotal
    });
    calculatedTotal += subtotal;
  }

  const [createdOrder] = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        buyerId: session.user.id,
        totalPrice: calculatedTotal.toFixed(2),
        shippingRecipient: parsed.data.shipping_recipient,
        shippingPhone: parsed.data.shipping_phone,
        shippingAddress: parsed.data.shipping_address,
        paymentProofUrl: proofUrl,
        status: "PENDING",
        paymentStatus: "PENDING"
      })
      .returning({ id: orders.id, status: orders.status });

    await tx.insert(orderItems).values(
      pricedItems.map((item) => ({
        orderId: order.id,
        productId: item.product_id,
        quantity: item.qty,
        subtotal: item.subtotal.toFixed(2)
      }))
    );

    for (const item of parsed.data.items) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.qty}` })
        .where(eq(products.id, item.product_id));
    }

    await writeAuditLog(tx, {
      actor: session.user,
      action: proofUrl ? "CREATE_ORDER_WITH_PAYMENT_PROOF" : "CREATE_ORDER",
      module: "ORDER",
      entityId: order.id,
      detail: { total: calculatedTotal.toFixed(2), itemCount: parsed.data.items.length }
    });

    if (proofUrl) {
      await createNotification(tx, {
        role: "ADMIN",
        type: "INFO",
        title: "Bukti pembayaran baru",
        message: `Buyer membuat order #${order.id.slice(0, 8)} dengan bukti pembayaran.`,
        module: "ORDER",
        entityId: order.id
      });
    }

    return [order];
  });

  return NextResponse.json({ order_id: createdOrder.id, status: createdOrder.status }, { status: 201 });
}

async function parseOrderPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawItems = formData.get("items");
    const proof = formData.get("proof");
    let items: unknown[] = [];

    try {
      items = typeof rawItems === "string" ? JSON.parse(rawItems) : [];
    } catch {
      items = [];
    }

    return {
      payload: {
        items,
        total_price: formData.get("total_price"),
        shipping_recipient: formData.get("shipping_recipient"),
        shipping_phone: formData.get("shipping_phone"),
        shipping_address: formData.get("shipping_address")
      },
      proof: proof instanceof File ? proof : null
    };
  }

  return {
    payload: await request.json(),
    proof: null
  };
}
