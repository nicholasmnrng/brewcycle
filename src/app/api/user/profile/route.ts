import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  notifications_enabled: z.coerce.boolean(),
  privacy_mode: z.coerce.boolean()
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Input profil tidak valid" }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      birthDate: parsed.data.birth_date || null,
      gender: parsed.data.gender || null,
      notificationsEnabled: parsed.data.notifications_enabled,
      privacyMode: parsed.data.privacy_mode
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
