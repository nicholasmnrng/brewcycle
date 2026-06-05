import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  date,
  type AnyPgColumn
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "CAFE", "DRIVER", "BUYER"]);

export const pickupStatusEnum = pgEnum("pickup_status", [
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "WAITING_OTP",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "FAILED"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PACKED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED"
]);

export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "VERIFIED", "REJECTED"]);

export const rewardTypeEnum = pgEnum("reward_type", [
  "EARNED_PICKUP",
  "EARNED_PURCHASE",
  "EARNED_REFERRAL",
  "REDEEMED"
]);

export const promoStatusEnum = pgEnum("promo_status", ["ACTIVE", "SCHEDULED", "EXPIRED", "DISABLED"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "SUCCESS",
  "ERROR",
  "WARNING",
  "INFO",
  "LOADING",
  "CONFIRMATION"
]);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    birthDate: date("birth_date"),
    gender: varchar("gender", { length: 32 }),
    notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
    privacyMode: boolean("privacy_mode").default(false).notNull(),
    driverOnline: boolean("driver_online").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    role: userRoleEnum("role").notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    referralCode: varchar("referral_code", { length: 32 }).notNull(),
    referredById: uuid("referred_by_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null"
    }),
    referralBonusAwarded: boolean("referral_bonus_awarded").default(false).notNull(),
    createdAt
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    referralCodeUnique: uniqueIndex("users_referral_code_unique").on(table.referralCode),
    roleIdx: index("users_role_idx").on(table.role)
  })
);

export const pickupRequests = pgTable(
  "pickup_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => users.id, { onDelete: "set null" }),
    estimatedWeight: numeric("estimated_weight", { precision: 10, scale: 2 }).notNull(),
    actualWeight: numeric("actual_weight", { precision: 10, scale: 2 }),
    pickupAddress: text("pickup_address"),
    pickupLatitude: numeric("pickup_latitude", { precision: 10, scale: 7 }),
    pickupLongitude: numeric("pickup_longitude", { precision: 10, scale: 7 }),
    contactName: varchar("contact_name", { length: 160 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    pickupNotes: text("pickup_notes"),
    status: pickupStatusEnum("status").default("PENDING").notNull(),
    scheduleDate: timestamp("schedule_date", { withTimezone: true }).notNull(),
    originalScheduleDate: timestamp("original_schedule_date", { withTimezone: true }),
    rescheduleReason: text("reschedule_reason"),
    reminderH1Sent: boolean("reminder_h1_sent").default(false).notNull(),
    reminderH0Sent: boolean("reminder_h0_sent").default(false).notNull(),
    proofPhotoUrl: text("proof_photo_url"),
    otpCode: varchar("otp_code", { length: 6 }),
    otpCodeHash: varchar("otp_code_hash", { length: 255 }),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    otpAttempts: integer("otp_attempts").default(0).notNull(),
    zone: varchar("zone", { length: 80 }),
    createdAt
  },
  (table) => ({
    statusIdx: index("pickup_requests_status_idx").on(table.status),
    scheduleDateIdx: index("pickup_requests_schedule_date_idx").on(table.scheduleDate),
    driverIdIdx: index("pickup_requests_driver_id_idx").on(table.driverId),
    cafeIdIdx: index("pickup_requests_cafe_id_idx").on(table.cafeId)
  })
);

export const pickupRescheduleLog = pgTable(
  "pickup_reschedule_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pickupId: uuid("pickup_id")
      .notNull()
      .references(() => pickupRequests.id, { onDelete: "cascade" }),
    oldDate: timestamp("old_date", { withTimezone: true }).notNull(),
    newDate: timestamp("new_date", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    createdAt
  },
  (table) => ({
    pickupIdIdx: index("pickup_reschedule_log_pickup_id_idx").on(table.pickupId)
  })
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: varchar("category", { length: 80 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").notNull(),
    usageGuide: text("usage_guide"),
    imageUrl: text("image_url"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0").notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    createdAt
  },
  (table) => ({
    categoryIdx: index("products_category_idx").on(table.category),
    stockIdx: index("products_stock_idx").on(table.stock)
  })
);

export const promos = pgTable(
  "promos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    discountType: varchar("discount_type", { length: 32 }).default("PERCENT").notNull(),
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }).default("0").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: promoStatusEnum("status").default("ACTIVE").notNull(),
    isDisabled: boolean("is_disabled").default(false).notNull(),
    createdAt
  },
  (table) => ({
    productIdx: index("promos_product_id_idx").on(table.productId),
    statusIdx: index("promos_status_idx").on(table.status)
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    status: orderStatusEnum("status").default("PENDING").notNull(),
    shippingRecipient: varchar("shipping_recipient", { length: 160 }),
    shippingPhone: varchar("shipping_phone", { length: 32 }),
    shippingAddress: text("shipping_address"),
    paymentProofUrl: text("payment_proof_url"),
    shippingResi: varchar("shipping_resi", { length: 120 }),
    paymentStatus: paymentStatusEnum("payment_status").default("PENDING").notNull(),
    createdAt
  },
  (table) => ({
    statusIdx: index("orders_status_idx").on(table.status),
    buyerIdIdx: index("orders_buyer_id_idx").on(table.buyerId),
    paymentStatusIdx: index("orders_payment_status_idx").on(table.paymentStatus)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull()
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId)
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    isApproved: boolean("is_approved").default(false).notNull(),
    createdAt
  },
  (table) => ({
    productIdIdx: index("reviews_product_id_idx").on(table.productId),
    buyerIdIdx: index("reviews_buyer_id_idx").on(table.buyerId)
  })
);

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pointsDelta: integer("points_delta").notNull(),
    type: rewardTypeEnum("type").notNull(),
    description: text("description").notNull(),
    refId: varchar("ref_id", { length: 120 }),
    createdAt
  },
  (table) => ({
    userIdIdx: index("rewards_user_id_idx").on(table.userId),
    typeIdx: index("rewards_type_idx").on(table.type)
  })
);

export const rewardsCatalog = pgTable("rewards_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull()
});

export const environmentalConfig = pgTable(
  "environmental_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 80 }).notNull(),
    value: numeric("value", { precision: 12, scale: 4 }).notNull()
  },
  (table) => ({
    keyUnique: uniqueIndex("environmental_config_key_unique").on(table.key)
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role"),
    type: notificationTypeEnum("type").default("INFO").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    message: text("message"),
    module: varchar("module", { length: 80 }),
    entityId: varchar("entity_id", { length: 120 }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    roleIdx: index("notifications_role_idx").on(table.role),
    readIdx: index("notifications_is_read_idx").on(table.isRead)
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorName: varchar("actor_name", { length: 160 }),
    actorRole: userRoleEnum("actor_role"),
    action: varchar("action", { length: 120 }).notNull(),
    module: varchar("module", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 120 }),
    detail: jsonb("detail"),
    createdAt
  },
  (table) => ({
    actorIdx: index("audit_logs_actor_id_idx").on(table.actorId),
    moduleIdx: index("audit_logs_module_idx").on(table.module),
    actionIdx: index("audit_logs_action_idx").on(table.action)
  })
);

export const gamificationConfig = pgTable(
  "gamification_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 80 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt
  },
  (table) => ({
    keyUnique: uniqueIndex("gamification_config_key_unique").on(table.key)
  })
);

export const usersRelations = relations(users, ({ many, one }) => ({
  referredBy: one(users, {
    fields: [users.referredById],
    references: [users.id],
    relationName: "referrals"
  }),
  referrals: many(users, { relationName: "referrals" }),
  cafePickups: many(pickupRequests, { relationName: "cafe_pickups" }),
  driverPickups: many(pickupRequests, { relationName: "driver_pickups" }),
  orders: many(orders),
  rewards: many(rewards),
  reviews: many(reviews)
}));

export const pickupRequestsRelations = relations(pickupRequests, ({ one, many }) => ({
  cafe: one(users, {
    fields: [pickupRequests.cafeId],
    references: [users.id],
    relationName: "cafe_pickups"
  }),
  driver: one(users, {
    fields: [pickupRequests.driverId],
    references: [users.id],
    relationName: "driver_pickups"
  }),
  rescheduleLogs: many(pickupRescheduleLog)
}));

export const pickupRescheduleLogRelations = relations(pickupRescheduleLog, ({ one }) => ({
  pickup: one(pickupRequests, {
    fields: [pickupRescheduleLog.pickupId],
    references: [pickupRequests.id]
  })
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  reviews: many(reviews),
  promos: many(promos)
}));

export const promosRelations = relations(promos, ({ one }) => ({
  product: one(products, {
    fields: [promos.productId],
    references: [products.id]
  })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id]
  }),
  buyer: one(users, {
    fields: [reviews.buyerId],
    references: [users.id]
  })
}));

export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, {
    fields: [rewards.userId],
    references: [users.id]
  })
}));
