import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  environmentalConfig,
  gamificationConfig,
  products,
  promos,
  rewardsCatalog,
  users
} from "./schema";

async function main() {
  const passwordHash = await bcrypt.hash("BrewCycle123!", 10);

  await db
    .insert(users)
    .values([
      {
        name: "Admin BrewCycle",
        email: "admin@brewcycle.local",
        phone: "080000000001",
        role: "ADMIN",
        passwordHash,
        referralCode: "ADMIN001"
      },
      {
        name: "Kafe Demo",
        email: "cafe@brewcycle.local",
        phone: "080000000002",
        role: "CAFE",
        passwordHash,
        referralCode: "CAFE001"
      },
      {
        name: "Driver Demo",
        email: "driver@brewcycle.local",
        phone: "080000000003",
        role: "DRIVER",
        passwordHash,
        referralCode: "DRIVER001"
      },
      {
        name: "Buyer Demo",
        email: "buyer@brewcycle.local",
        phone: "080000000004",
        role: "BUYER",
        passwordHash,
        referralCode: "BUYER001"
      }
    ])
    .onConflictDoNothing();

  await db
    .insert(products)
    .values([
      {
        category: "Pupuk",
        name: "Kompos Ampas Kopi",
        description: "Produk turunan ampas kopi untuk campuran media tanam.",
        usageGuide: "Taburkan secukupnya pada media tanam, lalu siram secara berkala.",
        imageUrl: "seed/kompos-ampas-kopi.jpg",
        price: "25000.00",
        stock: 50,
        unit: "pack"
      },
      {
        category: "Perawatan",
        name: "Coffee Scrub Natural",
        description: "Scrub berbasis ampas kopi olahan untuk kebutuhan perawatan.",
        usageGuide: "Gunakan pada kulit lembap, gosok perlahan, lalu bilas bersih.",
        imageUrl: "seed/coffee-scrub-natural.jpg",
        price: "45000.00",
        stock: 30,
        unit: "jar"
      }
    ])
    .onConflictDoNothing();

  await db
    .insert(rewardsCatalog)
    .values([
      {
        name: "Voucher Produk Rp10.000",
        description: "Potongan belanja produk BrewCycle senilai Rp10.000.",
        pointsRequired: 100,
        stock: 100,
        isActive: true
      },
      {
        name: "Gratis Ongkir",
        description: "Reward subsidi pengiriman untuk pembelian produk turunan.",
        pointsRequired: 150,
        stock: 50,
        isActive: true
      }
    ])
    .onConflictDoNothing();

  const [seedProduct] = await db.select({ id: products.id }).from(products).limit(1);

  await db
    .insert(promos)
    .values([
      {
        productId: seedProduct?.id,
        title: "Eco Starter Deal",
        description: "Promo pembelian produk olahan ampas kopi untuk pelanggan baru.",
        discountType: "PERCENT",
        discountValue: "10.00",
        status: "ACTIVE",
        isDisabled: false
      }
    ])
    .onConflictDoNothing();

  await db
    .insert(environmentalConfig)
    .values([
      { key: "co2_per_kg", value: "2.5000" },
      { key: "methane_per_kg", value: "0.1000" },
      { key: "trees_per_kg", value: "0.0100" }
    ])
    .onConflictDoNothing();

  await db
    .insert(gamificationConfig)
    .values([
      {
        key: "pickup_points_per_kg",
        label: "Poin pickup per kg",
        value: "10.00",
        description: "Poin Cafe untuk setiap kg ampas kopi completed."
      },
      {
        key: "purchase_points_per_10000",
        label: "Poin pembelian per Rp10.000",
        value: "5.00",
        description: "Legacy backend Buyer points, disembunyikan dari UI Buyer."
      },
      {
        key: "referral_bonus",
        label: "Bonus referral",
        value: "50.00",
        description: "Bonus saat referee menyelesaikan transaksi/pickup pertama."
      }
    ])
    .onConflictDoNothing();
}

main()
  .then(() => {
    console.log("Seed data inserted.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
