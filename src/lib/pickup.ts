import bcrypt from "bcryptjs";

export const pickupSlots = {
  MORNING: { label: "Pagi", hour: 9 },
  AFTERNOON: { label: "Siang", hour: 13 },
  EVENING: { label: "Sore", hour: 16 }
} as const;

export type PickupSlot = keyof typeof pickupSlots;

export function createScheduleDate(date: string, slot: PickupSlot) {
  const schedule = new Date(date);
  schedule.setHours(pickupSlots[slot].hour, 0, 0, 0);
  return schedule;
}

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOtpCode(otpCode: string) {
  return bcrypt.hash(otpCode, 10);
}

export function getNextReminder(scheduleDate: Date) {
  const reminder = new Date(scheduleDate);
  reminder.setDate(reminder.getDate() - 1);
  reminder.setHours(9, 0, 0, 0);
  return reminder;
}

export function canCafeReschedule(status: string) {
  return status === "PENDING" || status === "ASSIGNED";
}

export function getPickupCenter() {
  return {
    lat: Number(process.env.PICKUP_CENTER_LAT ?? "-6.200000"),
    lng: Number(process.env.PICKUP_CENTER_LNG ?? "106.816666")
  };
}

export function distanceInMeters(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function pickupPriority(scheduleDate: Date) {
  const today = new Date();
  if (scheduleDate.toDateString() === today.toDateString()) {
    return "HIGH";
  }

  if (scheduleDate < today) {
    return "OVERDUE";
  }

  return "NORMAL";
}
