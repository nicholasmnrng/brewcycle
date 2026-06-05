# BrewCycle QA Final - PRD Lock

Tanggal QA: 2026-05-30

## Hasil Validasi Command

- `npx.cmd tsc --noEmit`: PASS
- `npm.cmd run lint`: PASS
- `npm.cmd run build`: PASS
- Static scan fitur Phase 2 (`Midtrans`, `Xendit`, `AI Route`, `multi-cabang`): PASS, hanya muncul di `PRD.md`.

## Checklist PRD

| Checklist | Status | Bukti Implementasi |
| --- | --- | --- |
| Semua role bisa login dan akses dashboard masing-masing | PASS | `src/auth.ts`, `middleware.ts`, `src/db/seed.ts` menyediakan `ADMIN`, `CAFE`, `DRIVER`, `BUYER`. |
| Mobile punya bottom navigation | PASS | `src/components/app-shell.tsx` memakai `MobileBottomNav` pada breakpoint `< sm`. |
| Admin desktop punya sidebar | PASS | `DesktopSidebar` aktif untuk role `ADMIN` pada `lg:block`. |
| Cafe/Driver/Buyer desktop punya top nav | PASS | `DesktopTopNav` aktif untuk non-admin pada desktop/tablet. |
| Pickup flow selesai dari request sampai completed | PASS | `/api/pickup/request`, `/api/pickup/assign`, `/api/pickup/check-in`, `/api/pickup/complete`. |
| Request pickup punya detail operasional | PASS | Form Kafe mewajibkan alamat, titik GPS, PIC, nomor PIC, zona, tanggal, slot, dan estimasi berat. |
| Kafe bisa batalkan request pickup | PASS | `/api/pickup/cancel` mengubah status menjadi `CANCELLED` untuk request yang belum berjalan. |
| OTP gagal 3x tertangani | PASS | `/api/pickup/complete` menaikkan `otp_attempts` dan set status `FAILED` pada attempt ke-3. |
| Foto >5MB ditolak | PASS | `/api/pickup/complete`, `/api/order/upload-proof`, dan admin product upload membatasi 5MB `.jpg/.png`. |
| Marketplace manual transfer berjalan | PASS | `/dashboard/products`, `/dashboard/cart`, `/api/order/create`, `/api/order/upload-proof`. |
| Admin bisa verify payment | PASS | `/dashboard/orders`, `/api/admin/verify-payment`. |
| Poin bertambah sesuai aturan | PASS | Pickup `10 poin/kg`; purchase `5 poin/Rp10.000` via `src/lib/rewards.ts`. |
| Redeem reward mengurangi poin | PASS | `/api/reward/redeem` mengurangi `users.total_points`, stok catalog, dan menulis ledger `REDEEMED`. |
| Impact dashboard akurat | PASS | `/dashboard/impact`, `/api/impact/dashboard`; koefisien `2.5`, `0.1`, `0.01`. |
| Loading, empty, error state tersedia | PASS | `src/app/loading.tsx`, `src/app/error.tsx`, `src/components/empty-state.tsx`. |
| Tidak ada fitur Phase 2 masuk MVP | PASS | Tidak ada payment gateway, AI route optimization, push notification, atau multi-cabang. |

## Manual QA Setelah Database Siap

Gunakan akun seed:

- Admin: `admin@brewcycle.local` / `BrewCycle123!`
- Kafe: `cafe@brewcycle.local` / `BrewCycle123!`
- Driver: `driver@brewcycle.local` / `BrewCycle123!`
- Buyer: `buyer@brewcycle.local` / `BrewCycle123!`

Alur pickup:

1. Login sebagai Kafe.
2. Buka `/dashboard/pickup`, buat request pickup, catat OTP.
3. Pastikan alamat, PIC, nomor PIC, zona, dan titik GPS terisi sebelum submit.
4. Coba batalkan request lain yang masih `PENDING` untuk memastikan status menjadi `CANCELLED`.
5. Login sebagai Admin.
6. Buka `/dashboard/logistics`, assign pickup ke Driver.
7. Login sebagai Driver.
8. Buka `/dashboard/tasks`, check-in GPS, submit berat + foto + OTP.
9. Coba OTP salah 3x pada pickup lain untuk memastikan status `FAILED`.

Alur marketplace:

1. Login sebagai Buyer.
2. Buka `/dashboard/products`, tambah produk ke cart.
3. Buka `/dashboard/cart`, buat order dan upload bukti transfer.
4. Login sebagai Admin.
5. Buka `/dashboard/orders`, approve payment, input resi, update status order.
6. Login Buyer lagi, cek `/dashboard/history`.

Alur poin dan impact:

1. Cek reward history di `/dashboard/rewards` setelah pickup/order selesai.
2. Redeem reward dan pastikan saldo turun.
3. Cek `/dashboard/impact` setelah pickup `COMPLETED`.

## Catatan QA

- Runtime login/API membutuhkan `.env` berisi `DATABASE_URL` valid dan database sudah menjalankan migration + seed.
- Peta driver memakai Leaflet + OpenStreetMap, gratis dan tidak membutuhkan token Mapbox.
- Cron reminder siap via `vercel.json`; pengiriman email aktif jika `RESEND_API_KEY` tersedia.
- Notifikasi MVP memakai browser notification + toast in-app sesuai revisi, tanpa layanan push eksternal berbayar.
