import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders, pickupRequests, products } from "@/db/schema";

export const runtime = "nodejs";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

function toPdf(title: string, rows: Array<Record<string, unknown>>) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();

    if (!rows.length) {
      doc.fontSize(10).text("Tidak ada data.");
      doc.end();
      return;
    }

    rows.slice(0, 200).forEach((row, index) => {
      doc.fontSize(11).text(`${index + 1}. ${JSON.stringify(row)}`, {
        width: 520
      });
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa export data" }, { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "orders";
  const format = url.searchParams.get("format") ?? "csv";

  const rows =
    type === "pickups"
      ? await db.select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt))
      : type === "products"
        ? await db.select().from(products).orderBy(desc(products.createdAt))
        : await db.select().from(orders).orderBy(desc(orders.createdAt));

  if (format === "pdf") {
    const pdf = await toPdf(`BrewCycle ${type}`, rows);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="brewcycle-${type}.pdf"`
      }
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="brewcycle-${type}.csv"`
    }
  });
}
