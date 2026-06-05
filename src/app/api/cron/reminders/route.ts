import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { pickupRequests, users } from "@/db/schema";

async function sendReminderEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "BrewCycle <noreply@brewcycle.local>",
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`Resend failed with status ${response.status}`);
  }

  return { skipped: false };
}

function dayRange(offsetDays: number) {
  const start = new Date();
  start.setDate(start.getDate() + offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const isH1Window = now.getHours() === 9;
  const isH0Window = now.getHours() === 7;
  const target = isH1Window ? dayRange(1) : isH0Window ? dayRange(0) : null;

  if (!target) {
    return NextResponse.json({ sent: 0, message: "Di luar window reminder" });
  }

  const rows = await db
    .select({
      id: pickupRequests.id,
      scheduleDate: pickupRequests.scheduleDate,
      cafeEmail: users.email,
      cafeName: users.name,
      reminderH1Sent: pickupRequests.reminderH1Sent,
      reminderH0Sent: pickupRequests.reminderH0Sent
    })
    .from(pickupRequests)
    .innerJoin(users, eq(pickupRequests.cafeId, users.id))
    .where(
      and(
        gte(pickupRequests.scheduleDate, target.start),
        lt(pickupRequests.scheduleDate, target.end),
        eq(pickupRequests.status, "ASSIGNED")
      )
    );

  let sent = 0;

  for (const pickup of rows) {
    if ((isH1Window && pickup.reminderH1Sent) || (isH0Window && pickup.reminderH0Sent)) {
      continue;
    }

    await sendReminderEmail(
      pickup.cafeEmail,
      isH1Window ? "Reminder pickup BrewCycle H-1" : "Reminder pickup BrewCycle hari ini",
      `<p>Halo ${pickup.cafeName}, pickup ampas kopi dijadwalkan pada ${pickup.scheduleDate.toISOString()}.</p>`
    );

    await db
      .update(pickupRequests)
      .set(isH1Window ? { reminderH1Sent: true } : { reminderH0Sent: true })
      .where(eq(pickupRequests.id, pickup.id));
    sent += 1;
  }

  return NextResponse.json({ sent });
}
