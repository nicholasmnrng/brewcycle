export type PromoCandidate = {
  id: string;
  productId?: string | null;
  title: string;
  discountType: string;
  discountValue: string | number;
  status?: string;
  isDisabled?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

export type AppliedPromo = {
  id: string;
  title: string;
  discountLabel: string;
  discountAmount: number;
  finalPrice: number;
  originalPrice: number;
};

export function isPromoUsable(promo: PromoCandidate, now = new Date()) {
  if (promo.status && promo.status !== "ACTIVE") return false;
  if (promo.isDisabled) return false;

  const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
}

export function promoDiscountAmount(price: number, promo: PromoCandidate) {
  const value = Number(promo.discountValue);
  if (!Number.isFinite(value) || value <= 0) return 0;

  const discount =
    promo.discountType === "PERCENT"
      ? price * (Math.min(value, 100) / 100)
      : value;

  return Math.max(0, Math.min(price, Math.round(discount)));
}

export function promoDiscountLabel(promo: PromoCandidate) {
  const value = Number(promo.discountValue);
  if (promo.discountType === "PERCENT") return `${value}%`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export function bestPromoForProduct(productId: string, price: number, promos: PromoCandidate[], now = new Date()): AppliedPromo | null {
  const usablePromos = promos.filter((promo) => isPromoUsable(promo, now) && (!promo.productId || promo.productId === productId));
  let best: AppliedPromo | null = null;

  for (const promo of usablePromos) {
    const discountAmount = promoDiscountAmount(price, promo);
    if (!discountAmount) continue;

    const appliedPromo: AppliedPromo = {
      id: promo.id,
      title: promo.title,
      discountLabel: promoDiscountLabel(promo),
      discountAmount,
      finalPrice: Math.max(0, price - discountAmount),
      originalPrice: price
    };

    if (!best || appliedPromo.discountAmount > best.discountAmount) {
      best = appliedPromo;
    }
  }

  return best;
}
