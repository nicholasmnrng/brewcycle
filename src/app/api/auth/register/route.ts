import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid").transform((value) => value.toLowerCase()),
  phone: z.string().min(8, "Nomor telepon minimal 8 karakter").optional().or(z.literal("")),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["CAFE", "DRIVER", "BUYER"]),
  referralCode: z.string().optional().or(z.literal(""))
});

function createReferralCode(name: string) {
  const base = name
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(4, "X");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${base}${suffix}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 }
    );
  }

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser.length > 0) {
    return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 409 });
  }

  let referredById: string | null = null;

  if (parsed.data.referralCode) {
    const [referrer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, parsed.data.referralCode.toUpperCase()))
      .limit(1);
    referredById = referrer?.id ?? null;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [createdUser] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      passwordHash,
      referralCode: createReferralCode(parsed.data.name),
      referredById
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    });

  return NextResponse.json({ user: createdUser }, { status: 201 });
}
