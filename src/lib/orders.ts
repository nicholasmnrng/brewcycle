export type CartItemInput = {
  product_id: string;
  qty: number;
};

export function purchasePoints(totalPrice: number) {
  return Math.floor(totalPrice / 10000) * 5;
}

export function formatRupiah(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value));
}
