import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";

const reviewSchema = z.object({
  review_id: z.string().uuid(),
  is_approved: z.boolean()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Hanya Admin yang bisa approve review" }, { status: 403 });
  }

  const parsed = reviewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input review tidak valid" }, { status: 400 });
  }

  await db
    .update(reviews)
    .set({ isApproved: parsed.data.is_approved })
    .where(eq(reviews.id, parsed.data.review_id));

  return NextResponse.json({ success: true });
}
