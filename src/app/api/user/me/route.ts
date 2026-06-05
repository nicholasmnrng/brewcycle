import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.user.id,
    role: session.user.role,
    name: session.user.name,
    points: session.user.totalPoints,
    referral_code: session.user.referralCode
  });
}
