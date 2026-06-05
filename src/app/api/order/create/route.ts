import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

const createOrderSchema = z.object({
  items: z.array(z.object({ product_id: z.string().uuid(), qty: z.coerce.number().int().positive() })).min(1),
  total_price: z.coerce.number().positive(),
  shipping_recipient: z.string().min(2, "Nama penerima wajib diisi"),
  shipping_phone: z.string().min(8, "Nomor penerima minimal 8 karakter"),
  shipping_address: z.string().min(10, "Alamat pengiriman minimal 10 karakter")
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "BUYER") {
    return NextResponse.json({ message: "Hanya Buyer yang bisa membuat order" }, { status: 403 });
  }

  const parsed = createOrderSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input order tidak valid" }, { status: 400 });
  }

  const productIds = parsed.data.items.map((item) => item.product_id);
  const productRows = await db.select().from(products).where(inArray(products.id, productIds));
  const productMap = new Map(productRows.map((product) => [product.id, product]));

  let calculatedTotal = 0;

  for (const item of parsed.data.items) {
    const product = productMap.get(item.product_id);

    if (!product) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.stock < item.qty) {
      return NextResponse.json({ message: `Stok ${product.name} tidak cukup` }, { status: 409 });
    }

    calculatedTotal += Number(product.price) * item.qty;
  }

  if (Math.abs(calculatedTotal - parsed.data.total_price) > 1) {
    return NextResponse.json({ message: "Total harga tidak sesuai" }, { status: 400 });
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
        status: "PENDING",
        paymentStatus: "PENDING"
      })
      .returning({ id: orders.id, status: orders.status });

    await tx.insert(orderItems).values(
      parsed.data.items.map((item) => {
        const product = productMap.get(item.product_id);
        const subtotal = Number(product?.price ?? 0) * item.qty;

        return {
          orderId: order.id,
          productId: item.product_id,
          quantity: item.qty,
          subtotal: subtotal.toFixed(2)
        };
      })
    );

    for (const item of parsed.data.items) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.qty}` })
        .where(eq(products.id, item.product_id));
    }

    return [order];
  });

  return NextResponse.json({ order_id: createdOrder.id, status: createdOrder.status }, { status: 201 });
}
