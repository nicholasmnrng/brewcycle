# PRD — Project Requirements Document

## 1. Overview
**BrewCycle** adalah platform *sirkular ekonomi hijau* yang menghubungkan empat pihak utama: **Kafe** (penghasil limbah), **Driver** (pengumpul & logistik), **Admin** (pengelola pengolahan), dan **Buyer** (konsumen produk turunan).

Tujuan utama BrewCycle adalah mengubah limbah ampas kopi menjadi produk bernilai jual melalui sistem logistik yang efisien, penjadwalan yang fleksibel, dan gamifikasi berbasis poin. 

Prinsip antarmuka (UI/UX) BrewCycle berfokus pada **Clean & User Friendly**:
1.  **Clarity:** Informasi status tugas, dampak lingkungan, dan saldo poin disajikan secara langsung tanpa visual yang membingungkan.
2.  **Efficiency:** Alur input data (form penjadwalan, input OTP) dioptimalkan untuk meminimalkan jumlah klik.
3.  **Cross-Device Consistency:** Pengalaman pengguna yang konsisten namun teradaptasi secara fungsional antara perangkat *Mobile* dan *Desktop*.

---

## 2. Requirements – Spesifikasi Teknis & UI/UX

### 2.1 Multi‑Role Access & Responsivitas Desktop/Mobile
Sistem ini dirancang dengan pendekatan **Mobile-First** untuk kemudahan akses di lapangan (Driver/Kafe), namun diperluas secara elegan untuk pengelolaan di **Desktop** (Admin/Buyer).

*   **Mobile (< 640px) - Mode Lapangan:**
    *   **Navigasi:** Menggunakan **Bottom Navigation Bar** tetap dengan 4-5 item utama (Home, Map/Task, History, Profile).
    *   **Layout:** Komponen ditampilkan dalam *full-width* atau *single-column stack* untuk kemudahan penggunaan satu tangan (thumb-friendly).
    *   **Interaksi:** Tombol aksi utama (CTA) mengambang (*floating*) di bagian bawah layar untuk akses cepat.
    *   **Input:** Utilisasi *native picker* (date, location) dan *full-screen modal* untuk form kompleks agar tidak terpotong oleh navigasi.

*   **Tablet (640px - 1024px):**
    *   Layout kolom 2 untuk *cards*.
    *   Navigasi Bottom Bar disesuaikan menjadi lebih ringkas atau menjadi *Top Nav* jika diperlukan.

*   **Desktop (> 1024px) - Mode Manajemen:**
    *   **Navigasi:**
        *   *Admin:* Menggunakan **Sidebar Kiri** untuk akses cepat ke semua modul manajemen.
        *   *Kafe/Driver/Buyer:* Menggunakan **Top Navigation Bar** dengan tombol aksi yang jelas.
    *   **Layout:** Menggunakan **CSS Grid System** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Data list (produk, riwayat transaksi) ditampilkan dalam bentuk *Data Table* atau *Grid Cards* yang lebar, memanfaatkan layar monitor secara maksimal.
    *   **Whitespace:** Meningkatkan *padding* antar elemen untuk menciptakan kesan "Clean" dan lega, menghindari overcrowding yang sering terjadi pada dashboard web.

*   **Auth:** Menggunakan **Auth.js (NextAuth v5)** dengan strategi JWT. Middleware melakukan proteksi route berdasarkan role (`ADMIN`, `CAFE`, `DRIVER`, `BUYER`).

*   **State Layar Wajib:**
    *   *Loading:* Skeleton loader yang responsif (lebar 100% di mobile, grid di desktop).
    *   *Empty:* Layout terpusat (centered) dengan ilustrasi dan CTA.
    *   *Error:* Global error boundary dengan pesan user-friendly.

### 2.2 Penjadwalan & Reminder Otomatis
- **Sistem Reminder:** Background jobs dikirim via **Resend** (Email) pada H-1 pukul 09:00 dan H-0 pukul 07:00.
- **Reschedule:** Kafe bisa melakukan reschedule jika status masih `PENDING` atau `ASSIGNED`. Riwayat disimpan di `PICKUP_RESCHEDULE_LOG`.

### 2.3 Ekosistem Poin & Gamifikasi
- **Earning:**
    - Kafe: 10 poin / 1 kg ampas (aktual).
    - Buyer: 5 poin / Rp 10.000 belanja.
- **Referral:** Bonus 50 poin saat referee menyelesaikan *transaksi/pickup* pertama.
- **Redemption:** Poin ditukar via `REWARDS_CATALOG`.

### 2.4 Logistik & Verifikasi
- **Keamanan OTP:** Kafe generate 6 digit. Hash disimpan di DB. Validasi radius GPS driver < 100m. Maksimal 3 percobaan input OTP.
- **Bukti Foto:** Wajib upload `.jpg/.png` max 5MB.

### 2.5 Marketplace & Dampak Lingkungan
- **Visualisasi Dampak:** Chart tren bulanan dengan breakdown CO2 & Methane.
- **Koefisien:** 1 kg ampas = 2.5 kg CO2, 0.1 kg Methane, 0.01 Pohon.

---

## 3. Core Features

### 3.1 Fitur Kafe (Mitra Kopi)
- **Dashboard Ringkas:** Widget dampak hari ini & status pickup terakhir.
- **Penjadwalan:** Form kalender yang simpel (Mobile: Bottom Sheet; Desktop: Modal Form).
- **Gamification Center:** Tampilan riwayat poin dalam tabel bersih dan katalog hadiah.

### 3.2 Fitur Driver
- **Taskboard:** Daftar tugas harian dengan prioritas.
- **Navigasi:** Integrasi Mapbox (Mobile: Fullscreen map; Desktop: Side-panel map + list).
- **Alur Pickup:**
    1. Check-in (GPS verification).
    2. Input Berat.
    3. Upload Foto (Camera/Gallery).
    4. Input OTP.
    5. Submit.

### 3.3 Fitur Pembeli (Buyer)
- **E-commerce:** Grid produk responsif. Detail produk dengan *sticky footer* di mobile untuk tombol "Beli".
- **Tracking Pesanan:** Stepper vertikal (Mobile) / Horizontal (Desktop) dengan status:
    - `Pending` (Menunggu Konfirmasi Admin)
    - `Packed` (Dikemas)
    - `Shipped` (Dikirim + Link Resi)
    - `Completed` (Selesai + Review)

### 3.4 Fitur Admin
- **Dashboard KPI:** Grid layout menampilkan kartu metrik (Total Pendapatan, Limbah Terolah, etc.) secara real-time.
- **Logistik Control:** Tabel drag-and-drop atau assign manual untuk mapping Driver ke Pickup Request.
- **Inventory & Produk:** CRUD Produk dengan manajemen stok dan upload foto produk.
- **Laporan:** Fitur export data ke CSV/PDF.

---

## 4. User Flow & State Machine

### 4.1 Mesin Pickup (Driver/Cafe Loop)
`PENDING` → `ASSIGNED` → `IN_TRANSIT` (Check-in GPS) → `WAITING_OTP` → `COMPLETED`
*Failure Path:* `FAILED` triggered if OTP fails 3 times or system-level failure occurs. Admin intervention is required to reset or reassign these requests.

### 4.2 Mesin Pesanan (Buyer Loop)
`PENDING` → `PAID` (Upload Bukti) → `VERIFIED` (Admin Action) → `SHIPPED` → `COMPLETED`.
*Refund Path:* Admin reject bukti transfer → status kembali ke `PENDING`.

---

## 5. Architecture & Database Schema

Sistem menggunakan arsitektur **Serverless-Ready** dengan PostgreSQL sebagai database utama. Drizzle ORM dikonfigurasi untuk memanfaatkan tipe data native PostgreSQL guna memastikan akurasi numerik (poin/uang/berat) dan manajemen waktu yang aman (`TIMESTAMPTZ`).

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email UK
        string phone
        string role "ADMIN, CAFE, DRIVER, BUYER"
        string password_hash
        int total_points
        string referral_code UK
        string referred_by_id FK
        boolean referral_bonus_awarded
        timestamptz created_at
    }

    PICKUP_REQUESTS {
        uuid id PK
        uuid cafe_id FK
        uuid driver_id FK
        decimal estimated_weight
        decimal actual_weight
        string status "PENDING, ASSIGNED, IN_TRANSIT, COMPLETED, CANCELLED, RESCHEDULED, FAILED"
        timestamptz schedule_date
        timestamptz original_schedule_date
        string reschedule_reason
        boolean reminder_h1_sent
        boolean reminder_h0_sent
        string proof_photo_url
        string otp_code_hash
        timestamptz otp_expires_at
        int otp_attempts default 0
        string zone
        timestamptz created_at
    }

    PICKUP_RESCHEDULE_LOG {
        uuid id PK
        uuid pickup_id FK
        timestamptz old_date
        timestamptz new_date
        string reason
        timestamptz created_at
    }

    PRODUCTS {
        uuid id PK
        string category
        string name
        text description
        text usage_guide
        decimal price
        int stock
        string unit
        decimal rating_avg
        int review_count
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        uuid buyer_id FK
        decimal total_price
        string status "PENDING, PACKED, SHIPPED, COMPLETED, CANCELLED"
        string payment_proof_url
        string shipping_resi
        string payment_status "PENDING, VERIFIED, REJECTED" default PENDING
        timestamptz created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal subtotal
    }

    REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid buyer_id FK
        int rating
        text comment
        boolean is_approved default false
        timestamptz created_at
    }

    REWARDS {
        uuid id PK
        uuid user_id FK
        int points_delta
        string type "EARNED_PICKUP, EARNED_PURCHASE, EARNED_REFERRAL, REDEEMED"
        string description
        string ref_id
        timestamptz created_at
    }

    REWARDS_CATALOG {
        uuid id PK
        string name
        string description
        int points_required
        int stock
        boolean is_active
    }

    ENVIRONMENTAL_CONFIG {
        uuid id PK
        string key UK
        decimal value
    }
    
    USERS ||--o{ PICKUP_REQUESTS : "requests / assigned"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ REWARDS : "earns"
    USERS ||--o{ REVIEWS : "writes"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDER_ITEMS }o--|| PRODUCTS : "references"
    PRODUCTS ||--o{ REVIEWS : "receives"
    PICKUP_REQUESTS ||--o{ PICKUP_RESCHEDULE_LOG : "has history"
```

*Catatan Teknis PostgreSQL & Drizzle:*
- Semua `id` menggunakan tipe `uuid` (v4) untuk keamanan dan distribusi global yang aman.
- Nilai desimal (`price`, `weight`, `rating`) menggunakan `NUMERIC/DECIMAL` di PostgreSQL untuk menghindari floating-point arithmetic errors.
- Timestamp menggunakan `TIMESTAMPTZ` dan di-handle secara konsisten dalam zona waktu `Asia/Jakarta` (atau UTC di storage, dikonversi via backend).
- Drizzle ORM menggunakan `pg-core` dengan strategi migrasi otomatis (`drizzle-kit push`).

---

## 6. Tech Stack
- **Framework:** Next.js 14 (App Router) - Optimasi SEO dan Server Components.
- **Database:** **PostgreSQL** (via Neon, Supabase, atau Vercel Postgres) dengan koneksi pool (Supabase PgBouncer atau PgBouncer bawaan Vercel).
- **ORM:** **Drizzle ORM** (Type-safe, ringan, dukungan native PostgreSQL).
- **Auth:** Auth.js (NextAuth v5) dengan JWT & Cookies.
- **Styling:** Tailwind CSS + shadcn/ui.
- **Maps:** Mapbox GL JS.
- **Storage:** Vercel Blob.
- **Email:** Resend.
- **Cron/Job:** Vercel Cron Jobs untuk reminder.

---

## 7. API Design (Deterministic Kontrak)

### 7.1 Authentication & User
- `POST /api/auth/[...nextauth]`
- `GET /api/user/me` → `{ id, role, name, points, referral_code }`

### 7.2 Pickup Flow (Cafe & Driver)
- **POST `/api/pickup/request`** (Cafe)
  - Input: `{ estimated_weight, schedule_date, slot }`
  - Output: `{ id, status: "PENDING", next_reminder }`
- **POST `/api/pickup/assign`** (Admin)
  - Input: `{ pickup_id, driver_id }`
  - Output: `{ status: "ASSIGNED" }`
- **POST `/api/pickup/check-in`** (Driver)
  - Input: `{ pickup_id, lat, lng }`
  - Validation: Check radius < 100m.
  - Output: `{ status: "IN_TRANSIT", otp_hint: "Minta kode OTP ke Kafe" }`
- **POST `/api/pickup/complete`** (Driver)
  - Input: `{ pickup_id, otp_input, actual_weight, photo_url }`
  - Output: `{ status: "COMPLETED", points_earned }`

### 7.3 Order Flow (Buyer & Admin)
- **POST `/api/order/create`** (Buyer)
  - Input: `{ items: [{product_id, qty}], total_price }`
  - Output: `{ order_id, status: "PENDING" }`
- **POST `/api/order/upload-proof`** (Buyer)
  - Input: `{ order_id, proof_url }`
  - Output: `{ status: "VERIFICATION_PENDING" }`
- **POST `/api/admin/verify-payment`** (Admin)
  - Input: `{ order_id, action: "APPROVE|REJECT", note? }`
  - Output: `{ status: action === "APPROVE" ? "PACKED" : "PENDING" }`

### 7.4 Reward & Impact
- **GET `/api/impact/dashboard`** → `{ co2_saved, trees_saved, waste_kg }`
- **POST `/api/reward/redeem`** (User)
  - Input: `{ catalog_id, points_used }`
  - Output: `{ success: boolean, message, new_balance }`

---

## 8. UI/UX Design System (Clean & User Friendly)

### 8.1 Warna & Tema
- **Primary:** `#15803d` (Green-700) - Melambangkan ekologi dan keamanan. Digunakan pada tombol aksi utama dan indikator status sukses.
- **Secondary:** `#78350f` (Amber-900) - Melambangkan identitas kopi. Digunakan untuk aksen visual, ikon, dan branding.
- **Neutral:** `#f8fafc` (Slate-50) - Latar belakang utama untuk kesan bersih dan lega.
- **Alert:** Merah (`#dc2626`) untuk error/gagal, Kuning (`#d97706`) untuk peringatan.

### 8.2 Tata Letak (LAYOUT)
- **Breakpoints:**
  - Mobile: `max-w-md mx-auto` (mengoptimalkan layar kecil agar fokus pada konten).
  - Desktop: `max-w-7xl mx-auto px-4` (lebar penuh untuk dashboard).
- **Components Patterns:**
  - *Cards:* Menggunakan shadow lembut (`shadow-sm`) dan border tipis. Sudut membulat (`rounded-xl`) untuk kesan modern.
  - *Buttons:* Tinggi minimal 44px (standar aksesibilitas mobile). Icon di sebelah kiri teks.

### 8.3 Mikro-interaksi
- **Status Badge:** Animasi *pulse* halus pada status `IN_TRANSIT` atau `PENDING`.
- **Transisi Halaman:** Fade-in smooth saat navigasi antar tab.
- **Feedback Form:** Validasi *real-time* dengan pesan error yang spesifik ("Berat tidak boleh nol") alih-alih error umum server.

---

## 9. MVP Scope & Constraints

### ✅ Termasuk MVP (Phase 1)
1.  **Multi-role Auth** (Cafe, Driver, Admin, Buyer).
2.  **Sistem Pickup** dengan jadwal & reschedule.
3.  **Verifikasi Driver** (GPS Radius, Foto, OTP).
4.  **Gamifikasi Poin** (Hitung & History).
5.  **Marketplace Sederhana (Listing Produk, Keranjang Belanja Digital, Checkout dengan Pembayaran Manual via Transfer)**.
6.  **Admin Dashboard** (Assign Driver, Verify Payment).
7.  **Visualisasi Dampak Lingkungan** (Hitung otomatis).
8.  **Responsivitas** (Mobile & Desktop UI).

### ❌ Dikesampingkan (Phase 2)
1.  Payment Gateway Otomatis (Midtrans/Xendit). Transaksi masih manual upload bukti transfer.
2.  AI Route Optimization untuk driver.
3.  Push Notification (Hanya Email reminder).
4.  Fitur Multi-cabang untuk 1 akun Kafe.

### ⚠️ Batasan Teknis
- **OTP Hangus:** Jika 3x salah, status kembali ke `ASSIGNED` atau memerlukan aksi Admin untuk reset.
- **Reschedule:** Batas maksimal 1x reschedule per request agar logistik tidak kacau.
- **Offline:** Aplikasi tidak akan crash, tetapi button submit akan disabled dan muncul notifikasi toast "Offline Mode".
- **Database Connection:** Menggunakan connection pooling untuk mencegah batas koneksi maksimum PostgreSQL saat scale-out Vercel. Query kompleks diindeks via `CREATE INDEX` pada kolom `status`, `schedule_date`, dan `driver_id`.

---

## 10. Penutup
Dokumen ini mendefinisikan **BrewCycle** sebagai aplikasi yang siap dibangun. Fokus utama pada fase ini adalah keandalan (reliability) alur logistik, kesederhanaan (usability) untuk pengguna lapangan (Driver/Kafe), dan skalabilitas sistem poin yang transparan. Seluruh skema, tipe data, dan kontrak API telah disesuaikan dengan ekosistem **PostgreSQL + Drizzle ORM** serta mengutamakan antarmuka yang bersih dan kompatibel di Desktop maupun Mobile. Tim pengembang/AI Agent dipersilakan menggunakan spesifikasi ini untuk implementasi langsung.